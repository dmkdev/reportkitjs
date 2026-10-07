import { Image, Text, View } from '@react-pdf/renderer';
import type { ImageProps } from '../../core/types';
import { usePdfReportContext } from './context';

/**
 * @react-pdf/renderer only decodes raster images (PNG, JPEG, GIF). SVG
 * sources (data URLs or `.svg` URLs) are not supported and would throw
 * "Invalid base64 image", so we detect them and render a placeholder box
 * instead of passing them to `<Image>`.
 */
function isSvgSource(src: string): boolean {
  if (src.startsWith('data:image/svg+xml')) return true;
  const path = src.split(/[?#]/)[0];
  return path.toLowerCase().endsWith('.svg');
}

/**
 * Renders an image block. Only `width` is set (capped at the page content
 * width), which preserves the image's aspect ratio. SVG sources fall back
 * to a dashed placeholder box showing the alt text.
 */
export function PdfImageBlock({ props }: { props: ImageProps }) {
  const { styles, page } = usePdfReportContext();
  const width = Math.min(props.maxWidth ?? page.contentWidth, page.contentWidth);

  if (isSvgSource(props.src)) {
    return (
      <View style={{ alignItems: 'center' }}>
        <View
          style={{
            width,
            height: 80,
            borderWidth: 1,
            borderColor: '#cbd5e1',
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
          }}
        >
          <Text style={{ color: '#64748b', fontSize: 10 }}>
            {props.alt || 'Image (SVG not supported in PDF)'}
          </Text>
        </View>
        {props.caption && <Text style={styles.imageCaption}>{props.caption}</Text>}
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Image src={props.src} style={{ width }} />
      {props.caption && <Text style={styles.imageCaption}>{props.caption}</Text>}
    </View>
  );
}
