import { useState, useCallback } from 'react'
import { ethers } from 'ethers'

interface WalletState {
  address: string | null
  isConnecting: boolean
  error: string | null
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnecting: false,
    error: null,
  })

  const connect = useCallback(async (): Promise<string | null> => {
    if (!window.ethereum) {
      setState(s => ({ ...s, error: 'MetaMask not found. Please install MetaMask.' }))
      return null
    }

    setState(s => ({ ...s, isConnecting: true, error: null }))

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setState({ address, isConnecting: false, error: null })
      return address
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect wallet'
      setState({ address: null, isConnecting: false, error: msg })
      return null
    }
  }, [])

  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!window.ethereum) return null
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const signature = await signer.signMessage(message)
      return signature
    } catch {
      return null
    }
  }, [])

  const disconnect = useCallback(() => {
    setState({ address: null, isConnecting: false, error: null })
  }, [])

  return { ...state, connect, signMessage, disconnect }
}

// Extend window type
declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }
  }
}
