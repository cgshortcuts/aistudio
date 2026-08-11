import type {
  MessageContent,
  MessageImageContent,
  MessageVideoContent,
  MessageAudioContent,
  MessageModel3DContent
} from "../../../stores/ApiTypes";

export function isImageContent(c: MessageContent): c is MessageImageContent {
  return c.type === "image_url";
}

export function isVideoContent(c: MessageContent): c is MessageVideoContent {
  return c.type === "video";
}

export function isAudioContent(c: MessageContent): c is MessageAudioContent {
  return c.type === "audio";
}

export function isModel3DContent(c: MessageContent): c is MessageModel3DContent {
  return c.type === "model_3d";
}

/**
 * Returns true if the content array is purely image + video + audio + 3D media
 * blocks — i.e. the kind of output produced by a media generation turn.
 */
export function isMediaOnlyContent(content: unknown): boolean {
  if (!Array.isArray(content) || content.length === 0) {
    return false;
  }
  return content.every(
    (c) =>
      typeof c === "object" &&
      c !== null &&
      (isImageContent(c as MessageContent) ||
        isVideoContent(c as MessageContent) ||
        isAudioContent(c as MessageContent) ||
        isModel3DContent(c as MessageContent))
  );
}
