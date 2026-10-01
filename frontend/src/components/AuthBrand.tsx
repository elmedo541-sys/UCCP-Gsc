import { Church, HeartHandshake, Users } from 'lucide-react';

export default function AuthBrand({ description, admin = false }: { description: string; admin?: boolean }) {
  return <header className="gsc-auth-brand gsc-auth-story">
    <a href="/" aria-label="Good Samaritan Church home" className="gsc-auth-identity">
      <img src="/uccp-logo-transparent.png" alt="UCCP logo" width="72" height="72" />
      <span><small>UNITED CHURCH OF CHRIST IN THE PHILIPPINES</small><strong>Good Samaritan Church</strong></span>
    </a>
    <div className="gsc-auth-story-body">
      <span className="gsc-auth-kicker">{admin ? 'CHURCH ADMINISTRATION' : 'OUR CHURCH COMMUNITY'}</span>
      <h2>{admin ? <>Serving our church,<br /><em>together.</em></> : <>A place to belong.<br /><em>A faith we share.</em></>}</h2>
      <p>{description}</p>
      <div className="gsc-auth-window" aria-hidden="true"><div className="gsc-auth-cross" /><span /></div>
    </div>
    <div className="gsc-auth-values"><span><Church size={18} /> Worship</span><span><Users size={18} /> Fellowship</span><span><HeartHandshake size={18} /> Service</span></div>
  </header>;
}
