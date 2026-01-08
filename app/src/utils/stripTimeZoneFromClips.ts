import { IClip } from '../types/tng-api.interfaces';

/** Removes '|tz=UTC' from "created_at" value in clips array (in place). */
export default (aClips: IClip[]): void => {
    aClips.forEach((clip) => {
        if (clip.created_at) {
            const createdAt = clip.created_at.replace('|tz=UTC', '');
            // eslint-disable-next-line no-param-reassign
            clip.created_at = createdAt;
        }
    });
};
