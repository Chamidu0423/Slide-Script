import React from 'react'
import { createRoot } from 'react-dom/client'
import PresentationMaker from './Page'
import './styles.css'

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(
  <React.StrictMode>
    <PresentationMaker />
  </React.StrictMode>
)
