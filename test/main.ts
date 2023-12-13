import * as core from '@actions/core'
import {TwitterApi} from 'twitter-api-v2'
import {Key, StatusId, Tweet} from '../src/Tweet'
import {Maybe} from '../src/Maybe'

function validateInput(name: string): void {
  if (!core.getInput(name)) throw new Error(`${name} is a required input`)
}

async function test(): Promise<void> {
  validateInput('status')
  validateInput('consumer-key')
  validateInput('consumer-secret')
  validateInput('access-token')
  validateInput('access-token-secret')

  const status: string = core.getInput('status')

  console.log('🐦 Sending tweet')

  const twitter = new TwitterApi({
    appKey: core.getInput('consumer-key'),
    appSecret: core.getInput('consumer-secret'),
    accessToken: core.getInput('access-token'),
    accessSecret: core.getInput('access-token-secret')
  })

  const replyId: Maybe<StatusId> = core.getInput('replyId') as StatusId

  const history = new Map<Key, StatusId>([['reply' as Key, replyId]])

  const tweet = new Tweet(twitter, 'test' as Key, status, history)

  if (replyId) {
    console.log(`🐦 replying to ${replyId}`)
    const id = await tweet.replyTo('reply' as Key)
    console.log(`🐦 Retweet sent: ${id}`)
  } else {
    const id = await tweet.send()
    console.log(`🐦 Tweet sent: ${id}`)
  }
}

test()
