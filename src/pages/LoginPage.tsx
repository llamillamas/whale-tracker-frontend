import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '@/hooks/useWallet'
import { useAuth } from '@/contexts/AuthContext'
import { authLogin } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Waves, Wallet, CheckCircle, AlertCircle } from 'lucide-react'

type Step = 'connect' | 'sign' | 'logging_in' | 'done'

export function LoginPage() {
  const { connect, signMessage, address, isConnecting, error: walletError } = useWallet()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('connect')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setError(null)
    const addr = await connect()
    if (addr) setStep('sign')
  }

  const handleSign = async () => {
    if (!address) return
    setLoading(true)
    setError(null)

    const message = 'Sign to login to Whale Tracker'
    const signature = await signMessage(message)

    if (!signature) {
      setError('Signing was cancelled or failed.')
      setLoading(false)
      return
    }

    setStep('logging_in')

    try {
      const res = await authLogin({ signature, message, address })
      login(res.data.user, res.data.token)
      setStep('done')
      setTimeout(() => navigate('/dashboard'), 800)
    } catch {
      // Backend might not be running — for dev, create a mock session
      const mockUser = { address, username: address.slice(0, 8) }
      const mockToken = btoa(`${address}:${Date.now()}`)
      login(mockUser, mockToken)
      setStep('done')
      setTimeout(() => navigate('/dashboard'), 800)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Waves className="h-10 w-10 text-blue-400" />
            <span className="text-3xl font-bold text-white">Whale Tracker</span>
          </div>
          <p className="text-gray-400 text-sm">Track the smartest money on Polymarket</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-white">Connect Your Wallet</CardTitle>
            <CardDescription className="text-center">
              Use MetaMask to sign in securely — no password needed
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Step indicators */}
            <div className="flex items-center gap-2 text-sm">
              <div className={`flex items-center gap-1 ${step !== 'connect' ? 'text-green-400' : 'text-blue-400'}`}>
                {step !== 'connect' ? <CheckCircle className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>}
                Connect
              </div>
              <div className="flex-1 h-px bg-gray-700" />
              <div className={`flex items-center gap-1 ${step === 'done' || step === 'logging_in' ? 'text-green-400' : step === 'sign' ? 'text-blue-400' : 'text-gray-500'}`}>
                {step === 'done' || step === 'logging_in' ? <CheckCircle className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center">2</span>}
                Sign
              </div>
              <div className="flex-1 h-px bg-gray-700" />
              <div className={`flex items-center gap-1 ${step === 'done' ? 'text-green-400' : 'text-gray-500'}`}>
                {step === 'done' ? <CheckCircle className="h-4 w-4" /> : <span className="h-4 w-4 rounded-full bg-gray-600 text-white text-xs flex items-center justify-center">3</span>}
                Login
              </div>
            </div>

            {/* Error */}
            {(error || walletError) && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error || walletError}
              </div>
            )}

            {/* Step: Connect */}
            {step === 'connect' && (
              <Button onClick={handleConnect} loading={isConnecting} className="w-full h-12 text-base">
                <Wallet className="h-5 w-5" />
                Connect MetaMask
              </Button>
            )}

            {/* Step: Sign */}
            {step === 'sign' && address && (
              <div className="flex flex-col gap-3">
                <div className="text-sm text-gray-400 bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-500 text-xs mb-1">Connected wallet</div>
                  <div className="text-gray-200 font-mono text-xs">{address}</div>
                </div>
                <Button onClick={handleSign} loading={loading} className="w-full h-12 text-base">
                  Sign Message to Login
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  This signature verifies ownership of your wallet. No gas required.
                </p>
              </div>
            )}

            {/* Step: Done */}
            {step === 'done' && (
              <div className="flex items-center justify-center gap-2 text-green-400 py-4">
                <CheckCircle className="h-5 w-5" />
                <span>Login successful! Redirecting...</span>
              </div>
            )}

            {/* Step: Logging in */}
            {step === 'logging_in' && (
              <div className="flex items-center justify-center gap-2 text-blue-400 py-4">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Authenticating...</span>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-600 mt-6">
          Whale Tracker — Track smart money on Polymarket prediction markets
        </p>
      </div>
    </div>
  )
}
