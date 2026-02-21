
import React, { useState } from 'react'
import './index.css'

function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(isLogin ? 'Logging in...' : 'Registering...', formData)
    alert(isLogin ? 'Login Successful (Mock)' : 'Registration Successful (Mock)')
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="app-wrapper">
      <div className="bg-blob blob-1"></div>
      <div className="bg-blob blob-2"></div>

      <div className="auth-container">
        <div className="auth-header">
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLogin ? 'Enter your credentials to access TracePulse AI' : 'Join the elite trade predictive network'}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                className="input-style"
                placeholder="John Doe"
                required
                onChange={handleChange}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              className="input-style"
              placeholder="name@company.com"
              required
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="input-style"
              placeholder="••••••••"
              required
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn-primary">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"} {' '}
            <a
              href="#"
              className="auth-link"
              onClick={(e) => {
                e.preventDefault()
                setIsLogin(!isLogin)
              }}
            >
              {isLogin ? 'Register now' : 'Log in'}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
