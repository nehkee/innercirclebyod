export type MembershipTier = 'machine' | 'insider' | 'warlord' | 'industry';

export interface TierConfig {
  id:          MembershipTier;
  name:        string;
  tagline:     string;
  priceUSD:    number;
  priceNGN:    number;
  color:       string;
  colorRgb:    string;
  benefits:    string[];
  exclusive:   string[];
  featured?:   boolean;
}

export interface Event {
  id:          string;
  title:       string;
  type:        'listening_party' | 'show' | 'hangout' | 'studio' | 'industry' | 'secret';
  date:        string;
  location:    string;
  venue?:      string;
  description: string;
  priceUSD:    number;
  priceNGN:    number;
  capacity:    number;
  sold:        number;
  imageUrl?:   string;
  isVip?:      boolean;
  isSecret?:   boolean;
  isSoldOut?:  boolean;
  minTier?:    MembershipTier;
}

export interface Application {
  id:          string;
  type:        'hangout' | 'studio' | 'dinner' | 'backstage' | 'football';
  status:      'pending' | 'approved' | 'rejected';
  userId:      string;
  userName:    string;
  userEmail:   string;
  createdAt:   string;
  message?:    string;
}

export interface Member {
  id:          string;
  name:        string;
  tier:        MembershipTier;
  points:      number;
  joinedAt:    string;
  avatar?:     string;
  country?:    string;
  eventsAttended: number;
}

export interface Drop {
  id:          string;
  name:        string;
  type:        'merch' | 'music' | 'ticket' | 'invite';
  description: string;
  priceUSD:    number;
  priceNGN:    number;
  quantity:    number;
  sold:        number;
  dropDate:    string;
  endsAt?:     string;
  imageUrl?:   string;
  isPasswordProtected?: boolean;
  isSecret?:   boolean;
  minTier?:    MembershipTier;
}

export interface Raffle {
  id:          string;
  title:       string;
  description: string;
  prize:       string;
  endsAt:      string;
  entryPrice:  number;
  totalEntries: number;
  minTier?:   MembershipTier;
}
