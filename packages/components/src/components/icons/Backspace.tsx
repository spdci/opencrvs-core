import * as React from 'react'

const Backspace = (props: React.HTMLAttributes<SVGElement>) => (
  <svg width={34} height={21} fill="none" {...props}>
    <path
      d="M1 11l8.707 8.707a1 1 0 0 0 .707.293H32.5V1H10.445a1 1 0 0 0-.743.331L1 11z"
      stroke="#fff"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M23.728 4.893a.748.748 0 1 1 1.057 1.057l-9.516 9.516a.748.748 0 0 1-1.057-1.057l9.516-9.516z"
      fill="#fff"
    />
    <path
      d="M14.008 4.893a.748.748 0 0 1 1.057 0l9.516 9.516a.748.748 0 0 1-1.057 1.057L14.008 5.95a.748.748 0 0 1 0-1.057z"
      fill="#fff"
    />
  </svg>
)

export default Backspace