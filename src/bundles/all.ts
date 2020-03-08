// Support for ES5 bundle target
import '@polyfills/es5-target-shim';
// Builtin polyfills
import '@polyfills/polyfills.es6';

import BreakpointRegistry from '@helpers/media/smart-query-breakpoints';
import SmartQuery from '@helpers/media/smart-query';
import SmartRuleList from '@helpers/media/smart-rule-list';

import { SmartImage } from '@components/smart-image/smart-image';
import { SmartMedia } from '@components/smart-media/smart-media';
import { SmartPopup, SmartPopupTrigger } from '@components/smart-popup/smart-popup';
import { SmartCarousel, SmartCarouselDots, SmartCarouselLinkPlugin, SmartCarouselTouchPlugin, SmartCarouselAutoplayPlugin} from '@components/smart-carousel/smart-carousel';

if (!('customElements' in window)) {
  throw new Error('Browser is not support customElements, load polyfills before');
}

// BreakpointRegistry.addCustomBreakpoint('xxs', 300, 600); // Definition
// BreakpointRegistry.addCustomBreakpoint('xl', 1600, 2000); // Redefinition

// Default definition
// SmartImage.register();
// or SmartImage.register('my-image');
//
// SmartMedia.register();
//
// SmartCarousel.register();
// SmartCarouselDots.register();
// SmartCarouselLinkPlugin.register();
// SmartCarouselAutoplayPlugin.register();
//
// SmartPopup.register();
// SmartPopupTrigger.register();

export {
  BreakpointRegistry,
  SmartQuery,
  SmartRuleList,
  SmartImage,
  SmartPopup,
  SmartPopupTrigger,
  SmartMedia,
  SmartCarousel,
  SmartCarouselDots,
  SmartCarouselLinkPlugin,
  SmartCarouselTouchPlugin,
  SmartCarouselAutoplayPlugin
};