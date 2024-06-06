import express from "express";
import expressWs from 'express-ws';
import NodeCache from 'node-cache';

const router = express.Router()
const myCache = new NodeCache();

expressWs(router);

const createUser = (userID, cliant) => {
  const user = {
    cliant: cliant,
    userID: userID,
    hand: Math.range(1, 5)
  };
  myCache.set(userID, user);
  return user;
}

router.ws('/', (ws, req) => {
  ws.send('接続成功')
  console.log('接続成功');

  ws.on('message', msg => {
    ws.send(msg)
    console.log(msg)
  })
})

export {
  router as game
} ;