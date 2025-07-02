import React, { useState } from 'react';

function GoogleSheetsSetup() {
  const [showInstructions, setShowInstructions] = useState(false);

  const handleCreateSheet = () => {
    // Ouvrir Google Sheets avec un template
    const templateUrl = 'https://docs.google.com/spreadsheets/create';
    window.open(templateUrl, '_blank');
  };

  const sampleData = `Wilaya Code,Wilaya Name,Commune,Office Price,Home Price
01,Adrar,Adrar,650,1200
01,Adrar,Tamest,650,1200
02,Chlef,Chlef,450,650
02,Chlef,Tenes,450,650
16,Alger,Alger Centre,400,550
16,Alger,Bab El Oued,400,550
31,Oran,Oran,450,650
31,Oran,Es Senia,450,650`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleData);
    alert('Données copiées! Collez-les dans votre Google Sheet.');
  };

  return (
    <div className="sheets-setup">
      <div className="setup-header">
        <h2>Configuration Google Sheets pour Yalidine</h2>
        <p>Configurez votre Google Sheet pour synchroniser les tarifs Yalidine</p>
      </div>

      <div className="setup-steps">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>Créer un nouveau Google Sheet</h3>
            <p>Créez un nouveau Google Sheets avec le nom "Tarifs Yalidine"</p>
            <button onClick={handleCreateSheet} className="create-sheet-button">
              Créer Google Sheet
            </button>
          </div>
        </div>

        <div className="step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>Configurer les colonnes</h3>
            <p>Créez un onglet nommé "Tarifs" avec ces colonnes exactes:</p>
            <div className="columns-list">
              <span className="column">A: Wilaya Code</span>
              <span className="column">B: Wilaya Name</span>
              <span className="column">C: Commune</span>
              <span className="column">D: Office Price</span>
              <span className="column">E: Home Price</span>
            </div>
          </div>
        </div>

        <div className="step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h3>Ajouter des données d'exemple</h3>
            <p>Copiez ces données d'exemple dans votre sheet:</p>
            <div className="sample-data">
              <pre>{sampleData}</pre>
              <button onClick={copyToClipboard} className="copy-button">
                Copier les données
              </button>
            </div>
          </div>
        </div>

        <div className="step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h3>Partager le Google Sheet</h3>
            <p>Rendez votre Google Sheet public en lecture:</p>
            <ol>
              <li>Cliquez sur "Partager" en haut à droite</li>
              <li>Cliquez sur "Modifier l'accès"</li>
              <li>Sélectionnez "Tous les utilisateurs ayant le lien"</li>
              <li>Choisissez "Lecteur" comme autorisation</li>
              <li>Copiez l'ID du sheet depuis l'URL</li>
            </ol>
          </div>
        </div>

        <div className="step">
          <div className="step-number">5</div>
          <div className="step-content">
            <h3>Configurer l'application</h3>
            <p>Mettez à jour l'ID du Google Sheet dans le code:</p>
            <div className="code-snippet">
              <code>
                spreadsheetId: 'VOTRE_SHEET_ID_ICI'
              </code>
            </div>
            <p className="note">
              <strong>Note:</strong> L'ID se trouve dans l'URL de votre Google Sheet entre /d/ et /edit
            </p>
          </div>
        </div>
      </div>

      <div className="setup-tips">
        <h3>Conseils importants</h3>
        <div className="tips-grid">
          <div className="tip">
            <h4>🔄 Synchronisation</h4>
            <p>Les modifications dans Google Sheets apparaîtront dans l'application en 2 minutes maximum</p>
          </div>
          <div className="tip">
            <h4>👥 Collaboration</h4>
            <p>Plusieurs personnes peuvent modifier le Google Sheet simultanément</p>
          </div>
          <div className="tip">
            <h4>📊 Format des données</h4>
            <p>Respectez exactement le format: Code wilaya (01, 02...), prix en nombres entiers</p>
          </div>
          <div className="tip">
            <h4>🔒 Sécurité</h4>
            <p>Seules les personnes avec le lien peuvent voir les données</p>
          </div>
        </div>
      </div>

      <div className="setup-actions">
        <button 
          onClick={() => setShowInstructions(!showInstructions)}
          className="toggle-instructions"
        >
          {showInstructions ? 'Masquer' : 'Afficher'} les instructions détaillées
        </button>
      </div>

      {showInstructions && (
        <div className="detailed-instructions">
          <h3>Instructions détaillées</h3>
          
          <div className="instruction-section">
            <h4>Structure du Google Sheet</h4>
            <p>Votre Google Sheet doit avoir cette structure exacte:</p>
            <table className="structure-table">
              <thead>
                <tr>
                  <th>A</th>
                  <th>B</th>
                  <th>C</th>
                  <th>D</th>
                  <th>E</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Wilaya Code</td>
                  <td>Wilaya Name</td>
                  <td>Commune</td>
                  <td>Office Price</td>
                  <td>Home Price</td>
                </tr>
                <tr>
                  <td>01</td>
                  <td>Adrar</td>
                  <td>Adrar</td>
                  <td>650</td>
                  <td>1200</td>
                </tr>
                <tr>
                  <td>16</td>
                  <td>Alger</td>
                  <td>Alger Centre</td>
                  <td>400</td>
                  <td>550</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="instruction-section">
            <h4>Règles importantes</h4>
            <ul>
              <li>Le code wilaya doit être sur 2 chiffres (01, 02, 16...)</li>
              <li>Les prix doivent être des nombres entiers (pas de virgules)</li>
              <li>Le prix bureau doit être inférieur au prix domicile</li>
              <li>Pas de lignes vides entre les données</li>
              <li>L'onglet doit s'appeler exactement "Tarifs"</li>
            </ul>
          </div>

          <div className="instruction-section">
            <h4>Dépannage</h4>
            <ul>
              <li><strong>Données non chargées:</strong> Vérifiez que le sheet est public</li>
              <li><strong>Erreur 403:</strong> Vérifiez l'ID du spreadsheet</li>
              <li><strong>Données incomplètes:</strong> Vérifiez le format des colonnes</li>
              <li><strong>Pas de mise à jour:</strong> Attendez 2 minutes ou forcez le rechargement</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoogleSheetsSetup;
