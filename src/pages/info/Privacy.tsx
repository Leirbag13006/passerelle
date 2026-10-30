import { Link } from 'react-router'
import InfoPage, { Block } from '../InfoPage'

export default function Privacy() {
  return (
    <InfoPage
      kicker="Confidentialité"
      title={
        <>
          Vos données <span className="font-serif font-normal tracking-[-0.02em] text-accent italic">restent chez vous</span>
        </>
      }
      intro="Vos besoins de déplacement sont des informations personnelles, parfois liées à la santé. Passerelle est conçu pour les garder sur votre appareil."
    >
      <Block title="Ce que nous enregistrons, et où">
        <p>
          Votre profil (réponses au questionnaire, réglages d’affichage), vos trajets enregistrés et vos billets sont stockés <strong className="font-medium">uniquement dans votre navigateur</strong> (stockage local). Ils ne sont envoyés à aucun serveur Passerelle.
        </p>
        <p>Il n’y a ni compte, ni cookie publicitaire, ni outil de mesure d’audience.</p>
      </Block>
      <Block title="Le seul service externe : la recherche d’adresses">
        <p>
          Quand vous tapez une adresse, le texte saisi est envoyé au service public de géocodage de l’IGN (Géoplateforme) pour proposer des adresses. Aucune information de votre profil n’y est jointe.
        </p>
        <p>Les polices de caractères sont chargées depuis Google Fonts, qui reçoit l’adresse IP de votre appareil.</p>
      </Block>
      <Block title="Vos droits, en pratique">
        <ul className="flex list-disc flex-col gap-2 pl-6">
          <li>Consulter et modifier votre profil : « Mon espace », puis « Modifier mon profil ».</li>
          <li>Récupérer vos données : « Télécharger mon profil » (fichier JSON).</li>
          <li>Tout effacer : « Supprimer mon profil » efface aussi vos trajets et vos billets de cet appareil.</li>
        </ul>
        <p>
          <Link to="/espace" className="font-medium text-accent underline underline-offset-4">
            Aller à mon espace
          </Link>
        </p>
      </Block>
    </InfoPage>
  )
}
