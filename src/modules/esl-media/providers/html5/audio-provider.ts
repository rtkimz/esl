/**
 * Simple Audio API provider for {@link ESLMedia}
 * @version 1.0.0-alpha
 * @author Alexey Stsefanovich (ala'n)
 */

import {HTMLMediaProvider} from './media-provider';
import ESLMediaProviderRegistry from '../../core/esl-media-registry';

export class AudioProvider extends HTMLMediaProvider<HTMLAudioElement> {
  static get providerName() {
    return 'audio';
  }

  protected createElement(): HTMLAudioElement {
    const el = document.createElement('audio');
    el.src = this.component.mediaSrc;
    return el;
  }

  get defaultAspectRatio(): number {
    return 0;
  }
}

ESLMediaProviderRegistry.register(AudioProvider, AudioProvider.providerName);
