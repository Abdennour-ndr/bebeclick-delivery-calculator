import React from 'react';
import './App.css';
import DeliveryForm from './components/DeliveryForm';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>BebeClick - Plateforme de Gestion de Livraison</h1>
        <p className="header-subtitle">Solution professionnelle pour le calcul des coûts de livraison</p>
      </header>
      <main className="App-main">
        <DeliveryForm />
      </main>
    </div>
  );
}

export default App;


