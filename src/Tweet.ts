import {TwitterApi} from 'twitter-api-v2'
import {Maybe} from './Maybe'

export type Key = string & {readonly '': unique symbol}
export type StatusId = string & {readonly '': unique symbol}
export type History = [Key, StatusId][] & {readonly '': unique symbol}

export class Tweet {
  private readonly api: TwitterApi
  private readonly key: Key
  private readonly status: string
  private readonly history: History

  constructor(api: TwitterApi, key: Key, status: string, history: History) {
    this.api = api
    this.key = key
    this.status = status
    this.history = history
  }

  private statusFor(key: Key): StatusId | undefined {
    const message = this.history.find(([target, _]) => target == key)
    if (message) return message[1]
    else undefined
  }

  async send(): Promise<StatusId | undefined> {
    if (!this.statusFor(this.key)) {
      const tweet = await this.api.v2.tweet(this.status)
      return tweet.data.id as StatusId
    }
    return undefined
  }

  async replyTo(replyToKey: Key): Promise<StatusId | undefined> {
    const replyToId: Maybe<StatusId> = this.statusFor(replyToKey)
    if (!this.statusFor(this.key) && replyToId) {
      const tweet = await this.api.v2.reply(this.status, replyToId)
      return tweet.data.id as StatusId
    }
    return undefined
  }
}
