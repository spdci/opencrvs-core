import * as React from 'react'

export const Error = (props: React.HTMLAttributes<SVGElement>) => (
  <svg width={60} height={60} {...props}>
    <title>{'Icons/nav/error_60pt'}</title>
    <g fill="none" fillRule="evenodd">
      <rect
        stroke="#DB5C5C"
        strokeWidth={3}
        x={1.5}
        y={1.5}
        width={57}
        height={57}
        rx={28.5}
      />
      <path
        d="M32.092 29.97l6.364 6.365a1.5 1.5 0 1 1-2.121 2.12l-6.364-6.363-6.364 6.364a1.5 1.5 0 1 1-2.122-2.121l6.364-6.364-6.364-6.364a1.5 1.5 0 1 1 2.122-2.122l6.364 6.364 6.364-6.364a1.5 1.5 0 0 1 2.12 2.122l-6.363 6.364z"
        fill="#DB5C5C"
        fillRule="nonzero"
      />
    </g>
  </svg>
)

export default Error
