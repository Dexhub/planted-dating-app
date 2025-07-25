import './Skeleton.css';

const Skeleton = ({ variant = 'text', width, height, className = '' }) => {
  const classes = `skeleton skeleton-${variant} ${className}`;
  const style = {
    width: width || '100%',
    height: height || (variant === 'text' ? '20px' : '100%')
  };

  return <div className={classes} style={style} />;
};

export const ProfileCardSkeleton = () => (
  <div className="profile-card-skeleton">
    <Skeleton variant="image" height="400px" />
    <div className="skeleton-content">
      <Skeleton variant="text" width="60%" height="32px" />
      <Skeleton variant="text" width="40%" />
      <Skeleton variant="text" />
      <Skeleton variant="text" />
      <Skeleton variant="text" width="80%" />
    </div>
  </div>
);

export const MatchCardSkeleton = () => (
  <div className="match-card-skeleton">
    <Skeleton variant="circle" width="100px" height="100px" />
    <div className="skeleton-info">
      <Skeleton variant="text" width="120px" />
      <Skeleton variant="text" width="80px" />
    </div>
  </div>
);

export const MessageSkeleton = () => (
  <div className="message-skeleton">
    <Skeleton variant="circle" width="40px" height="40px" />
    <div className="skeleton-bubble">
      <Skeleton variant="text" width="200px" />
      <Skeleton variant="text" width="150px" />
    </div>
  </div>
);

export default Skeleton;