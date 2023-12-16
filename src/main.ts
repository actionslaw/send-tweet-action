import * as core from '@actions/core'
import {Maybe} from './Maybe'
import {TwitterApi} from 'twitter-api-v2'
import {StatusId, Tweet} from './Tweet'

function validateInput(name: string): void {
  if (!core.getInput(name)) throw new Error(`${name} is a required input`)
}

async function run(): Promise<void> {
  try {
    validateInput('status')
    validateInput('consumer-key')
    validateInput('consumer-secret')
    validateInput('access-token')
    validateInput('access-token-secret')

    core.setSecret(core.getInput('consumer-key'))
    core.setSecret(core.getInput('consumer-secret'))
    core.setSecret(core.getInput('access-token'))
    core.setSecret(core.getInput('access-token-secret'))

    const status: string = core.getInput('status')
    const replyTo: Maybe<StatusId> = core.getInput('replyto') as Maybe<StatusId>

    core.info(`🐦 Sending tweet [${status}]`)

    const twitter = new TwitterApi({
      appKey: core.getInput('consumer-key'),
      appSecret: core.getInput('consumer-secret'),
      accessToken: core.getInput('access-token'),
      accessSecret: core.getInput('access-token-secret')
    })

    const tweet = new Tweet(twitter, status)

    if (replyTo) {
      core.info(`🐦 replying to ${replyTo}`)
      const id = await tweet.replyTo(replyTo)
      core.info(`🐦 sent reply tweet [${id}]`)
      core.setOutput('status', id)
    } else {
      const id = await tweet.send()
      core.info(`🐦 sent tweet [${id}]`)
      core.setOutput('status', id)
    }
  } catch (error) {
    if (error instanceof Error) {
      core.error(error)
      core.setFailed(error.message)
    }
  }
}

run()
