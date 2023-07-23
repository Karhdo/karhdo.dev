import Image from '@/components/Image'
import ProfileInfo from '@/components/homepage/ProfileInfo';

const ProfileCard = () => {
  return (
    <div className='rounded overflow-hidden'>
      <Image
        src={'/static/images/avatar.jpg'}
        alt="avatar"
        width={550}
        height={350}
      />
      <div className="h-1.5 bg-gradient-to-r from-green-300 via-blue-500 to-purple-600"></div>
    </div>
  )
}

export default ProfileCard;
