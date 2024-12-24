import clsx from 'clsx';
import ReactMediumImageZoom, { type UncontrolledProps } from 'react-medium-image-zoom';

interface ZoomProps extends UncontrolledProps {
  children: React.ReactNode;
}

const Zoom = (props: ZoomProps) => {
  const { children, classDialog, ...rest } = props;

  return (
    <ReactMediumImageZoom
      zoomMargin={20}
      classDialog={clsx([
        '[&_[data-rmiz-modal-img]]:rounded-lg',
        '[&_[data-rmiz-btn-unzoom]]:hidden',
        '[&_[data-rmiz-modal-overlay="visible"]]:bg-black/80',
        classDialog,
      ])}
      {...rest}
    >
      {children}
    </ReactMediumImageZoom>
  );
};

export default Zoom;
