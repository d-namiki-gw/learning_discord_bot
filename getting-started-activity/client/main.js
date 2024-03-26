import { DiscordSDK } from "@discord/embedded-app-sdk";
import './style.css'
import rocketLogo from '/rocket.png'

let auth;

// Instantiate the SDK
const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
const instanceID = discordSdk.instanceId;

setupDiscordSdk().then(() => {
  console.log("Discord SDK is ready");
  discordSdk.subscribe("ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE", onUpdate, []);
  updateGuildAvatar();
  updateVoiceChannelName();
  connect_web_socket();
});

async function onUpdate(args) {
  updateUserIcons();
}


async function setupDiscordSdk() {
  await discordSdk.ready();

  // Authorize with Discord Client
  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
    response_type: "code",
    state: "",
    prompt: "none",
    scope: [
      "identify",
      "guilds",
    ],
  });

  // Retrieve an access_token from your activity's server
  const response = await fetch("/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
    }),
  });
  const { access_token } = await response.json();

  // Authenticate with Discord client (using the access_token)
  auth = await discordSdk.commands.authenticate({
    access_token,
  });

  if (auth == null) {
    throw new Error("Authenticate command failed");
  }
}

async function updateVoiceChannelName() {

  let activityChannelName = 'Unknown';
  // Requesting the channel in GDMs (when the guild ID is null) requires
  // the dm_channels.read scope which requires Discord approval.
  if (discordSdk.channelId != null && discordSdk.guildId != null) {
    // Over RPC collect info about the channel
    const channel = await discordSdk.commands.getChannel({channel_id: discordSdk.channelId});
    if (channel.name != null) {
      activityChannelName = channel.name;
    }
  }

  // Update the UI with the name of the current voice channel
  const textElem = document.querySelector('#activity-channel');
  const textTagString = `Activity Channel: "${activityChannelName}"`;
  textElem.innerHTML = textTagString;

}

async function updateUserIcons() {
  const userNames = [];
  const userIcons = [];
  const createImgElem = (path) => {
    const span = document.createElement('span');
    const img = document.createElement('img');
    img.setAttribute('src', path);
    img.setAttribute('width', '32px');
    img.setAttribute('height', '32px');
    img.setAttribute('style', 'border-radius: 50%;');
    span.appendChild(img);
    return span;
  };

  if (discordSdk.channelId != null && discordSdk.guildId != null) {
    const connectedParticipants = await discordSdk.commands.getInstanceConnectedParticipants();
    userNames.push(...connectedParticipants.participants.map(v => v.nickname ?? v.global_name));
    userIcons.push(...connectedParticipants.participants.map(user => `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`));
  }

  const users = document.querySelector('#users');
  users.innerHTML = userNames.join(",");  
  /*
  userIcons.forEach(v => {
    users.appendChild(createImgElem(v));
  });
  */

}

async function updateGuildAvatar() {
  const app = document.querySelector('#app');

  // 1. From the HTTP API fetch a list of all of the user's guilds
  const guilds = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
    headers: {
      // NOTE: we're using the access_token provided by the "authenticate" command
      Authorization: `Bearer ${auth.access_token}`,
      'Content-Type': 'application/json',
    },
  }).then((response) => response.json());

  // 2. Find the current guild's info, including it's "icon"
  const currentGuild = guilds.find((g) => g.id === discordSdk.guildId);

  // 3. Append to the UI an img tag with the related information
  if (currentGuild != null) {
    const path = `https://cdn.discordapp.com/icons/${currentGuild.id}/${currentGuild.icon}.webp?size=128`
    const guildImg = document.querySelector('#guild_image');
    guildImg.setAttribute(
      'src',
      path
    );
    /*
    const guildImg = document.createElement('img');
    guildImg.setAttribute(
      'src',
      // More info on image formatting here: https://discord.com/developers/docs/reference#image-formatting
      path
    );
    guildImg.setAttribute('width', '128px');
    guildImg.setAttribute('height', '128px');
    guildImg.setAttribute('style', 'border-radius: 50%;');
    app.appendChild(guildImg);
    */

    const guildName = document.querySelector('#guild_name');
    guildName.innerText = currentGuild.name;

  }
}

function connect_web_socket(){
    var sock = new WebSocket('/game');

    sock.addEventListener('open',function(e){// 接続
        console.log('Socket 接続成功');
    });

    sock.addEventListener('message',function(e){// サーバーからデータを受け取る
        console.log(e.data);
    });
}

document.querySelector('#app').innerHTML = `
  <div>
    <img src="${rocketLogo}" class="logo" id="guild_image" alt="Discord" />
    <h1>Hello, <span id="guild_name"></span>!</h1>
    <div id="activity-channel">Activity Channel:</div>
    <div>参加者: <span id="users"></span></div>
    <div>InstanceID: ${instanceID}</div>
  </div>
`;
