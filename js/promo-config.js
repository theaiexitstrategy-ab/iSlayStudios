/* ══ iSlay Studios — seasonal promo schedule ══════════════════════════════
 *
 * One entry per promo. The engine (js/promos.js) picks the FIRST entry whose
 * window contains the current time, evaluated as wall-clock time in
 * America/Chicago — not the visitor's time zone, not UTC.
 *
 *   id      unique slug. Also the sessionStorage key for "intro already seen".
 *   alias   short name for the preview override: ?promo=<alias or id>
 *   start   'YYYY-MM-DDTHH:MM' Chicago time, inclusive.
 *   end     'YYYY-MM-DDTHH:MM' Chicago time, inclusive through that minute
 *           ('2026-11-15T23:59' = live until 11:59:59 PM, off at midnight).
 *   theme   optional. Adds class "theme-<name>" to <html> before first paint
 *           (CSS lives in index.html, search "THEME:"); a matching entry in
 *           THEMES in promos.js can add decorations (e.g. falling leaves).
 *   banner  optional. Scrolling ticker across the top of the page. Leave it
 *           out and the banner strip is hidden (nav moves up to top:0).
 *   intro   optional. Overlay shown once per browser session on first load.
 *
 * Preview any state (works on any host; affects only the visitor whose URL
 * carries the param):
 *   ?promo=new-barber | ?promo=thanksgiving | ?promo=none
 *   ?promo_now=2026-11-20T09:00   time-travel, Chicago wall-clock
 * A forced ?promo= always replays the intro, even if already seen.
 *
 * Elements anywhere in the page can carry data-show-until / data-show-from
 * (same date format) and are removed outside that window — see the price
 * notice on Jaaslycezz's profile.
 */
window.ISLAY_PROMOS = [
  {
    id: 'new-barber-jaaslycezz-2026',
    alias: 'new-barber',
    start: '2026-11-10T00:00',
    end:   '2026-11-15T23:59',
    banner: {
      ariaLabel: 'New barber alert: Jaaslycezz has joined iSlay Studios',
      sep: '✦',
      pills: [
        { em: 'New Barber Alert', text: 'Welcome Jaaslycezz to iSlay' },
        { em: 'Sharp Cuts · Clean Fades', text: 'Walk-ins Welcome' }
      ]
    },
    intro: {
      variant: 'new-barber',
      eyebrow: 'New Barber Alert',
      image: {
        src: 'images/barbers/jaaslycezz/headshot-avatar-360.jpg',
        webp: 'images/barbers/jaaslycezz/headshot-avatar-160.webp 160w, images/barbers/jaaslycezz/headshot-avatar-360.webp 360w',
        width: 360, height: 360,
        alt: 'Jaaslycezz, professional barber at iSlay Studios'
      },
      title: 'Jaaslycezz',
      subtitle: 'Professional Barber · Now at iSlay Studios',
      tagline: 'Sharp Cuts • Clean Fades • Precision Grooming',
      handle: { text: '@jaaslycezz', href: 'https://instagram.com/jaaslycezz' },
      ctas: [
        { label: 'Meet Jaaslycezz →', scrollTo: '#jaaslycezz', kind: 'primary' },
        { label: 'Maybe Later', dismiss: true, kind: 'ghost' }
      ],
      confetti: { glyphs: ['✦', '◆', '✧', '★'], direction: 'rise' }
    }
  },
  {
    id: 'thanksgiving-2026',
    alias: 'thanksgiving',
    start: '2026-11-16T00:00',
    end:   '2026-11-30T23:59',
    theme: 'thanksgiving',
    banner: {
      ariaLabel: 'Happy Thanksgiving from iSlay Studios',
      sep: '❧',
      pills: [
        { em: 'Happy Thanksgiving from the iSlay Family', text: 'Get Fresh for the Holidays' },
        { em: 'Beat the Holiday Rush', text: 'Book Your Chair Today' }
      ]
    },
    intro: {
      variant: 'thanksgiving',
      eyebrow: 'Happy Thanksgiving',
      hero: 'Thankful',
      title: 'From the iSlay Family to Yours',
      subtitle: 'Get fresh for the holidays. Chairs fill fast Thanksgiving week, so lock in your look before the rush.',
      ctas: [
        { label: 'Beat the Holiday Rush →', scrollTo: '#team', kind: 'primary' },
        { label: 'Call the Studio · (314) 227-5264', href: 'tel:+13142275264', kind: 'ghost' }
      ],
      note: { text: 'Walk-ins welcome with Jaaslycezz · (636) 673-4864', href: 'tel:+16366734864' },
      confetti: { leaves: true, direction: 'fall' }
    }
  }
];
