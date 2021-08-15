import { svg } from '../../vendor/lit/lit.min.js'

export const home = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.75024 19.2502H17.2502C18.3548 19.2502 19.2502 18.3548 19.2502 17.2502V9.75025L12.0002 4.75024L4.75024 9.75025V17.2502C4.75024 18.3548 5.64568 19.2502 6.75024 19.2502Z"></path>
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.74963 15.7493C9.74963 14.6447 10.6451 13.7493 11.7496 13.7493H12.2496C13.3542 13.7493 14.2496 14.6447 14.2496 15.7493V19.2493H9.74963V15.7493Z"></path>
  </svg>

`

export const plus = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 5.75V18.25"></path>
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.25 12L5.75 12"></path>
  </svg>
`

export const bell = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.25 12V10C17.25 7.1005 14.8995 4.75 12 4.75C9.10051 4.75 6.75 7.10051 6.75 10V12L4.75 16.25H19.25L17.25 12Z"></path>
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 16.75C9 16.75 9 19.25 12 19.25C15 19.25 15 16.75 15 16.75"></path>
  </svg>
`

export const search = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.25 19.25L15.5 15.5M4.75 11C4.75 7.54822 7.54822 4.75 11 4.75C14.4518 4.75 17.25 7.54822 17.25 11C17.25 14.4518 14.4518 17.25 11 17.25C7.54822 17.25 4.75 14.4518 4.75 11Z"></path>
  </svg>
`

export const list = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" transform="translate(4 5)"><g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m11.5 5.5h-7"/><path d="m11.5 9.5h-7"/><path d="m11.5 1.5h-7"/></g><path d="m1.49884033 2.5c.5 0 1-.5 1-1s-.5-1-1-1-.99884033.5-.99884033 1 .49884033 1 .99884033 1zm0 4c.5 0 1-.5 1-1s-.5-1-1-1-.99884033.5-.99884033 1 .49884033 1 .99884033 1zm0 4c.5 0 1-.5 1-1s-.5-1-1-1-.99884033.5-.99884033 1 .49884033 1 .99884033 1z" fill="currentColor"/></g></svg>
`

export const clock = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="7.25" stroke="currentColor" stroke-width="1.5"></circle>
    <path stroke="currentColor" stroke-width="1.5" d="M12 8V12L14 14"></path>
  </svg>
`

export const star = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.75L13.75 10.25H19.25L14.75 13.75L16.25 19.25L12 15.75L7.75 19.25L9.25 13.75L4.75 10.25H10.25L12 4.75Z"></path>
  </svg>
`

export const cog = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" transform="translate(3 3)"><path d="m7.5.5c.35132769 0 .69661025.02588228 1.03404495.07584411l.50785434 1.53911115c.44544792.12730646.86820077.30839026 1.26078721.53578009l1.4600028-.70360861c.5166435.39719686.9762801.86487779 1.3645249 1.388658l-.7293289 1.44720284c.2201691.39604534.3936959.82158734.5131582 1.2692035l1.5298263.5338186c.0390082.29913986.0591302.60421522.0591302.91399032 0 .35132769-.0258823.69661025-.0758441 1.03404495l-1.5391112.50785434c-.1273064.44544792-.3083902.86820077-.5357801 1.26078721l.7036087 1.4600028c-.3971969.5166435-.8648778.9762801-1.388658 1.3645249l-1.4472029-.7293289c-.39604532.2201691-.82158732.3936959-1.26920348.5131582l-.5338186 1.5298263c-.29913986.0390082-.60421522.0591302-.91399032.0591302-.35132769 0-.69661025-.0258823-1.03404495-.0758441l-.50785434-1.5391112c-.44544792-.1273064-.86820077-.3083902-1.26078723-.5357801l-1.46000277.7036087c-.51664349-.3971969-.97628006-.8648778-1.36452491-1.388658l.72932886-1.4472029c-.2203328-.39633993-.39395403-.82222042-.51342462-1.27020241l-1.52968981-.53381682c-.03892294-.29882066-.05900023-.60356226-.05900023-.91299317 0-.35132769.02588228-.69661025.07584411-1.03404495l1.53911115-.50785434c.12730646-.44544792.30839026-.86820077.53578009-1.26078723l-.70360861-1.46000277c.39719686-.51664349.86487779-.97628006 1.388658-1.36452491l1.44720284.72932886c.39633995-.2203328.82222044-.39395403 1.27020243-.51342462l.53381682-1.52968981c.29882066-.03892294.60356226-.05900023.91299317-.05900023z" stroke-width=".933"/><circle cx="7.5" cy="7.5" r="3"/></g></svg>
`

export const space = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" transform="translate(2 4)"><path d="m.5 8.5 8 4 8.017-4"/><path d="m.5 4.657 8.008 3.843 8.009-3.843-8.009-4.157z"/></g></svg>
`

export const inbox = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" transform="translate(2.5 4.5)"><path d="m3.65939616 0h8.68120764c.4000282 0 .7615663.23839685.9191451.6060807l2.7402511 6.3939193v4c0 1.1045695-.8954305 2-2 2h-12c-1.1045695 0-2-.8954305-2-2v-4l2.74025113-6.3939193c.15757879-.36768385.51911692-.6060807.91914503-.6060807z"/><path d="m0 7h4c.55228475 0 1 .44771525 1 1v1c0 .55228475.44771525 1 1 1h4c.5522847 0 1-.44771525 1-1v-1c0-.55228475.4477153-1 1-1h4"/></g></svg>
`

export const user = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="3.25" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></circle>
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.8475 19.25H17.1525C18.2944 19.25 19.174 18.2681 18.6408 17.2584C17.8563 15.7731 16.068 14 12 14C7.93201 14 6.14367 15.7731 5.35924 17.2584C4.82597 18.2681 5.70558 19.25 6.8475 19.25Z"></path>
  </svg>
`

export const users = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5.78168 19.25H13.2183C13.7828 19.25 14.227 18.7817 14.1145 18.2285C13.804 16.7012 12.7897 14 9.5 14C6.21031 14 5.19605 16.7012 4.88549 18.2285C4.773 18.7817 5.21718 19.25 5.78168 19.25Z"></path>
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15.75 14C17.8288 14 18.6802 16.1479 19.0239 17.696C19.2095 18.532 18.5333 19.25 17.6769 19.25H16.75"></path>
    <circle cx="9.5" cy="7.5" r="2.75" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></circle>
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.75 10.25C16.2688 10.25 17.25 9.01878 17.25 7.5C17.25 5.98122 16.2688 4.75 14.75 4.75"></path>
  </svg>
`

export const userPlus = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="3.25" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></circle>
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12.25 19.25H6.94953C5.77004 19.25 4.88989 18.2103 5.49085 17.1954C6.36247 15.7234 8.23935 14 12.25 14"></path>
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 14.75V19.25"></path>
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.25 17L14.75 17"></path>
  </svg>
`

export const userMinus = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="8" r="3.25" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"></circle>
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12.25 19.25H6.94953C5.77004 19.25 4.88989 18.2103 5.49085 17.1954C6.36247 15.7234 8.23935 14 12.25 14"></path>
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.25 17L15.75 17"></path>
  </svg>
`

export const trash = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} fill="none" viewBox="0 0 24 24">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.75 7.75L7.59115 17.4233C7.68102 18.4568 8.54622 19.25 9.58363 19.25H14.4164C15.4538 19.25 16.319 18.4568 16.4088 17.4233L17.25 7.75"></path>
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 7.5V6.75C9.75 5.64543 10.6454 4.75 11.75 4.75H12.25C13.3546 4.75 14.25 5.64543 14.25 6.75V7.5"></path>
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 7.75H19"></path>
  </svg>
`

export const share = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" transform="translate(4 2)"><path d="m8.5 2.5-1.978-2-2.022 2"/><path d="m6.5.5v9"/><path d="m3.5 4.5h-1c-1.1045695 0-2 .8954305-2 2v7c0 1.1045695.8954305 2 2 2h8c1.1045695 0 2-.8954305 2-2v-7c0-1.1045695-.8954305-2-2-2h-1"/></g></svg>
`

export const upArrow = (width = 12, height = 12, cls = 'inline-block', strokeWidth = 35) => svg`
  <svg class=${cls} width=${width} height=${height} viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" xmlns:bx="https://boxy-svg.com">
    <path d="M 1321.327 852.661 H 1459.952 L 1459.952 753.132 L 1671.201 936.706 L 1459.952 1120.281 L 1459.952 1020.752 H 1321.327 V 852.661 Z" style="stroke: currentColor; fill: none; stroke-linecap: square; stroke-linejoin: round; stroke-width: ${strokeWidth}px;" transform="matrix(0.007473, -0.999972, 0.999972, 0.007473, -697.861877, 1719.222168)" bx:shape="arrow 1321.327 753.132 349.874 367.149 168.091 211.249 0 1@853d0790"/>
  </svg>
`

export const downArrow = (width = 12, height = 12, cls = 'inline-block', strokeWidth = 35) => svg`
  <svg class=${cls} width=${width} height=${height} viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" xmlns:bx="https://boxy-svg.com">
    <path d="M -1321.327 -653.603 H -1182.702 L -1182.702 -753.132 L -971.453 -569.557 L -1182.702 -385.983 L -1182.702 -485.512 H -1321.327 V -653.603 Z" style="stroke: currentColor; fill: none; stroke-linecap: square; stroke-linejoin: round; stroke-width: ${strokeWidth}px;" transform="matrix(0.007473, 0.999972, 0.999972, -0.007473, 828.108398, 1372.10144)" bx:shape="arrow -1321.327 -753.132 349.874 367.149 168.091 211.249 0 1@a091787f"/>
  </svg>
`

export const power = (width = 12, height = 12, cls = 'inline-block') => svg`
  <svg class=${cls} width=${width} height=${height} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="M 75.706 24.423 C 83.201 31.347 87.895 41.258 87.895 52.266 C 87.895 73.195 70.929 90.161 50 90.161 C 29.071 90.161 12.105 73.195 12.105 52.266 C 12.105 41.216 16.835 31.271 24.38 24.344" style="stroke: rgb(0, 0, 0); fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: 6px;"/>
  <line style="stroke: rgb(0, 0, 0); stroke-linecap: round; stroke-width: 6px;" x1="50" y1="11.31" x2="50" y2="53.67"/>
</svg>
`