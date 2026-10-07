import type { ImageProps } from '../../core/types';
import styles from '../styles/blocks.module.css';

export function ImageBlock({ props }: { props: ImageProps }) {
  return (
    <figure className={styles.imageWrap} style={{ margin: 0 }}>
      <img
        className={styles.image}
        src={props.src}
        alt={props.alt ?? ''}
        style={props.maxWidth ? { maxWidth: `${props.maxWidth}px` } : undefined}
      />
      {props.caption && <figcaption className={styles.imageCaption}>{props.caption}</figcaption>}
    </figure>
  );
}
