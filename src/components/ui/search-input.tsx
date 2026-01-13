'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

export default function SearchInput({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('query', term)
    } else {
      params.delete('query')
    }
    replace(`${pathname}?${params.toString()}`)
  }, 300)

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <label htmlFor="search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>
        <Search size={18} />
      </label>
      <input
        id="search"
        type="text"
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('query')?.toString()}
        style={{
          width: '100%',
          padding: '10px 10px 10px 35px',
          borderRadius: '6px',
          border: '1px solid #ddd',
          fontSize: '14px',
          outline: 'none'
        }}
      />
    </div>
  )
}
