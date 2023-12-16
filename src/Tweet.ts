import {TwitterApi} from 'twitter-api-v2'

export type StatusId = string & {readonly '': unique symbol}

export class Tweet {
  private readonly api: TwitterApi
  private readonly status: string

  constructor(api: TwitterApi, status: string) {
    this.api = api
    this.status = status
  }

  async send(): Promise<StatusId> {
    const tweet = await this.api.v2.tweet(this.status)
    return tweet.data.id as StatusId
  }

  async replyTo(replyToId: StatusId): Promise<StatusId | undefined> {
    const tweet = await this.api.v2.reply(this.status, replyToId)
    return tweet.data.id as StatusId
  }
}
