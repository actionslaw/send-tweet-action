import * as core from '@actions/core'
import {Maybe} from './Maybe'
import {TwitterApi} from 'twitter-api-v2'
import {Key, StatusId, Tweet} from './Tweet'

function validateInput(name: string): void {
  if (!core.getInput(name)) throw new Error(`${name} is a required input`)
}

async function run(): Promise<void> {
  try {
    validateInput('key')
    validateInput('status')
    validateInput('consumer-key')
    validateInput('consumer-secret')
    validateInput('access-token')
    validateInput('access-token-secret')

    core.setSecret(core.getInput('consumer-key'))
    core.setSecret(core.getInput('consumer-secret'))
    core.setSecret(core.getInput('access-token'))
    core.setSecret(core.getInput('access-token-secret'))

    const key: Key = core.getInput('key') as Key
    const status: string = core.getInput('status')

    core.info(`🐦 Sending tweet for ${key}`)

    const twitter = new TwitterApi({
      appKey: core.getInput('consumer-key'),
      appSecret: core.getInput('consumer-secret'),
      accessToken: core.getInput('access-token'),
      accessSecret: core.getInput('access-token-secret')
    })

    const replyToKey: Key = core.getInput('replyto') as Key
    const existingId: Maybe<StatusId> = core.getState(key) as StatusId
    const replyId: Maybe<StatusId> = core.getState(replyToKey) as StatusId

    const history = new Map<Key, StatusId>([
      [key, existingId],
      [replyToKey, replyId]
    ])

    const tweet = new Tweet(twitter, key, status, history)

    if (replyToKey) {
      core.info(`🐦 replying to ${replyToKey}/${replyId}`)
      const id = await tweet.replyTo(replyToKey)
      if (id) {
        core.info(`🐦 sent status ${id}`)
        core.saveState(key, id)
      } else
        core.notice(`🫤 Retweet ${key} orphaned or already sent - ignoring`)
    } else {
      const id = await tweet.send()
      if (id) {
        core.info(`🐦 sent status ${id}`)
        core.saveState(key, id)
      } else core.notice(`🫤 Tweet ${key} already sent - ignoring`)
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(error)
      core.setFailed(error.message)
    }
  }
}

run()
