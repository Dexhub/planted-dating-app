import { useState, useEffect } from 'react';
import './ProgressiveImage.css';

const ProgressiveImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholderSrc,
  onLoad,
  onError 
}) => {
  const [imgSrc, setImgSrc] = useState(placeholderSrc || '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImgSrc(src);
      setIsLoading(false);
      onLoad && onLoad();
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      onError && onError();
    };
    
    img.src = src;
  }, [src, onLoad, onError]);

  if (hasError) {
    return (
      <div className={`progressive-image-error ${className}`}>
        <span className="error-icon">🌱</span>
        <p>Image unavailable</p>
      </div>
    );
  }

  return (
    <div className={`progressive-image-wrapper ${className}`}>
      {isLoading && (
        <div className="progressive-image-loading">
          <div className="loading-spinner"></div>
        </div>
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`progressive-image ${isLoading ? 'loading' : 'loaded'}`}
        style={{
          filter: isLoading ? 'blur(10px)' : 'none',
          transform: isLoading ? 'scale(1.05)' : 'scale(1)'
        }}
      />
    </div>
  );
};

export default ProgressiveImage;