/**
 * ESLMediaProviderRegistry class to store media API providers
 * @version 1.0.0-alpha
 * @author Yuliya Adamskaya
 */
import ESLMedia from './esl-media';
import {Observable} from '../../esl-utils/abstract/observable';
import type {BaseProvider, ProviderType} from './esl-media-provider';

let evRegistryInstance: ESLMediaProviderRegistry | null = null;
export class ESLMediaProviderRegistry extends Observable {
  private providersMap: Map<string, ProviderType> = new Map();

  public static get instance() {
    if (!evRegistryInstance) {
      evRegistryInstance = new ESLMediaProviderRegistry();
    }
    return evRegistryInstance;
  }

  /** List of registered providers */
  public get providers(): ProviderType[] {
    const list: ProviderType[] = [];
    this.providersMap.forEach((provider) => list.push(provider));
    return list;
  }

  /** Register provider */
  public register(provider: ProviderType) {
    if (!provider.providerName) throw new Error('Provider should have name');
    this.providersMap.set(provider.providerName, provider);
    this.fire(provider.providerName, provider);
  }

  /** Check that provider is registered for passed name */
  public has(name: string) {
    return this.providersMap.has(name);
  }

  /** Find provider by name */
  public viaName(name: string) {
    if (!name || name === 'auto') return null;
    return this.providersMap.get(name.toLowerCase()) || null;
  }

  /** Create provider instance for passed ESLMedia instance */
  public createFor(media: ESLMedia): BaseProvider | null {
    return this.createByType(media) || this.createBySrc(media);
  }

  /** Create provider instance for passed ESLMedia instance via provider name */
  private createByType(media: ESLMedia): BaseProvider | null {
    const providerByType = this.viaName(media.mediaType);
    if (providerByType) {
      const config = Object.assign({}, providerByType.parseUrl(media.mediaSrc), providerByType.parseConfig(media));
      return new providerByType(media, config);
    }
    return null;
  }

  /** Create provider instance for passed ESLMedia instance via url */
  private createBySrc(media: ESLMedia): BaseProvider | null {
    for (const provider of this.providers) {
      const parsedConfig = provider.parseUrl(media.mediaSrc);
      if (!parsedConfig) continue;
      const config = Object.assign({}, parsedConfig, provider.parseConfig(media));
      return new provider(media, config);
    }
    return null;
  }
}

export default ESLMediaProviderRegistry.instance;
