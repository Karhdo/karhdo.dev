import Script from 'next/script';

interface UmamiAnalyticsProps {
  src?: string;
  websiteId?: string;
}

const UmamiAnalytics = ({ src = '/stats/script.js', websiteId }: UmamiAnalyticsProps) => {
  if (websiteId) {
    return <Script src={src} data-website-id={websiteId} async defer />;
  }

  return null;
};

export default UmamiAnalytics;
