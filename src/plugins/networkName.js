export default function networkName(shortname) {
  switch (shortname) {
    case 'IX23':
      return 'AMS-IX (Amsterdam)'
    case 'IX208':
      return 'DE-CIX (Frankfurt)'
    case 'IX438':
      return 'LINX (London)'
    case 'IX382':
      return 'INEX (Dublin)'
    case 'AS15169':
      return `Google (${shortname})`
    case 'AS21556':
      return `E-root (${shortname})`
    case 'AS25152':
      return `K-root (${shortname})`
    default:
      return shortname
  }
}
