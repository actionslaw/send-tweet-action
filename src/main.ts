import * as core from '@actions/core'
import { Maybe } from './Maybe'
import { TwitterApi } from 'twitter-api-v2'
import { Key, StatusId, Tweet, History } from './Tweet'
import { readFileSync, writeFileSync } from 'fs'
import { ensureFileSync } from 'fs-extra'

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
    const historyFile: Maybe<string> = core.getInput('history')
    const replyToKey: Key = core.getInput('replyto') as Key
    const history: History = Tweet.loadHistory(historyFile)

    core.info(`🐦 Sending tweet for ${key}`)
    core.debug(`🐦 Loading tweet history [${history}] from ${historyFile}`)

    const twitter = new TwitterApi({
      appKey: core.getInput('consumer-key'),
      appSecret: core.getInput('consumer-secret'),
      accessToken: core.getInput('access-token'),
      accessSecret: core.getInput('access-token-secret')
    })

    const tweet = new Tweet(twitter, key, status, history)

    function complete(id: StatusId) {
      core.info(`🐦 sent tweet [${id}]`)
      if (historyFile) {
        const updatedHistory = history.concat([[key, id]])
        core.debug(`🐦 Writing tweet history [${history}] to ${historyFile}`)
        ensureFileSync(historyFile)
        writeFileSync(historyFile, JSON.stringify(updatedHistory), 'utf8')
      }
    }

    if (replyToKey) {
      core.info(`🐦 replying to ${replyToKey}`)
      const id = await tweet.replyTo(replyToKey)
      if (id) complete(id)
      else core.notice(`🫤 Retweet ${key} orphaned or already sent - ignoring`)
    } else {
      const id = await tweet.send()
      if (id) complete(id)
      else core.notice(`🫤 Tweet ${key} already sent - ignoring`)
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(error)
      core.setFailed(error.message)
    }
  }
}

run()
