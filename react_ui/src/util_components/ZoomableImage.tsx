import React from 'react';
import './ZoomableImage.css';

type ZoomableImageProps = {
  src: string;
  className: string;
};

type ZoomableImageState = {
  imageZoom: boolean;
};

const initialState: ZoomableImageState = {
  imageZoom: false,
};

export default class ZoomableImage extends React.Component<ZoomableImageProps, ZoomableImageState> {
  static defaultProps = {
    className: '',
  };

  state = initialState;

  render() {
    const { src, className } = this.props;
    return (
      <img
        src={src}
        className={'zoomableImage ' + className}
        onMouseMove={this.positionImage}
        onMouseOut={this.restoreImage}
        onClick={this.toggleImgZoom}
      />
    );
  }

  toggleImgZoom = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    const imageZoom = !this.state.imageZoom;
    const target = e.target as HTMLElement;
    this.setState({ imageZoom });
    if (imageZoom) {
      target.classList.add('zoom');
      this.positionImage(e, true);
    } else this.restoreImage(e);
  };

  positionImage = (e: React.MouseEvent<HTMLImageElement, MouseEvent>, force?: boolean) => {
    if (!(force || this.state.imageZoom)) return;

    const target = e.target as HTMLImageElement;
    const { width, height, naturalWidth, naturalHeight } = target;
    const imgAreaRatio = width / height;
    const imgRatio = naturalWidth / naturalHeight;
    const xScale = imgRatio / imgAreaRatio;
    const [shownWidth, offset] =
      imgAreaRatio > imgRatio ? [width * xScale, (width * (1 - xScale)) / 2] : [width, 0];
    const { offsetX, offsetY } = e.nativeEvent;
    const scaledX = offsetX - offset;
    const posX = -(scaledX / shownWidth) * naturalWidth + width / 2;
    const posY = -(offsetY / height) * naturalHeight + height / 2;
    target.style.objectPosition = `${posX}px ${posY}px`;
  };

  restoreImage = (e: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    const target = e.target as HTMLElement;
    target.classList.remove('zoom');
    target.style.objectPosition = '';
    this.setState({ imageZoom: false });
  };
}
