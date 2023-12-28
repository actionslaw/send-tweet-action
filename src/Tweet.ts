import {SendTweetV2Params, TwitterApi} from 'twitter-api-v2'

export type StatusId = string & {readonly '': unique symbol}
export type MediaId = string & {readonly '': unique symbol}

export class Tweet {
  private readonly api: TwitterApi
  private readonly status: string

  constructor(api: TwitterApi, status: string) {
    this.api = api
    this.status = status
  }

  private makeOptions(media: MediaId[]): SendTweetV2Params {
    return {
      media: {
        media_ids: media
      }
    }
  }

  async upload(media: string): Promise<MediaId> {
    return (await this.api.v1.uploadMedia(media)) as MediaId
  }

  async send(media?: MediaId[]): Promise<StatusId> {
    const options = media ? this.makeOptions(media) : undefined
    const tweet = await this.api.v2.tweet(this.status, options)
    return tweet.data.id as StatusId
  }

  async replyTo(
    replyToId: StatusId,
    media?: MediaId[]
  ): Promise<StatusId | undefined> {
    const options = media ? this.makeOptions(media) : undefined
    const tweet = await this.api.v2.reply(this.status, replyToId, options)
    return tweet.data.id as StatusId
  }
}
