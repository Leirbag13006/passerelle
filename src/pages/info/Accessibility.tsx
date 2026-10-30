import { Link } from 'react-router'
import InfoPage, { Block, ToFill } from '../InfoPage'

export default function Accessibility() {
  return (
    <InfoPage
      kicker="Déclaration d’accessibilité"
      title={
        <>
          Passerelle, <span className="font-serif font-normal tracking-[-0.02em] text-accent italic">accessible à tous ?</span>
        </>
      }
      intro="Passerelle s’engage à rendre son site accessible, conformément au référentiel général d’amélioration de l’accessibilité (RGAA 4.1) et aux règles WCAG 2.2. Cette déclaration s’applique à l’ensemble du site."
    >
      <Block title="État de conformité">
        <p>
          Passerelle est <strong className="font-medium">partiellement conforme</strong> au RGAA 4.1. Aucun audit externe n’a encore été réalisé : l’état indiqué ici résulte d’une auto-évaluation par l’équipe du projet.
        </p>
        <p>
          Date de la déclaration : <ToFill>date</ToFill>.
        </p>
      </Block>

      <Block title="Ce que nous avons mis en place">
        <ul className="flex list-disc flex-col gap-2 pl-6">
          <li>Navigation complète au clavier, lien d’évitement « Aller au contenu », focus toujours visible.</li>
          <li>Formulaires avec étiquettes, groupes de choix (fieldset), messages annoncés aux lecteurs d’écran.</li>
          <li>Taille du texte réglable jusqu’à 200 %, en plus du zoom du navigateur.</li>
          <li>Mode contraste élevé, police très lisible (Atkinson Hyperlegible), mode simplifié.</li>
          <li>Animations coupées si votre appareil le demande, ou depuis votre profil.</li>
          <li>Lignes de transport toujours identifiées par un nom et un pictogramme, jamais par la couleur seule.</li>
          <li>Lecture à voix haute des questions, des trajets et du code du billet.</li>
        </ul>
      </Block>

      <Block title="Contenus non accessibles connus">
        <ul className="flex list-disc flex-col gap-2 pl-6">
          <li>Le ciel animé et les nuages sont décoratifs et masqués aux technologies d’assistance ; ils disparaissent en mode simplifié.</li>
          <li>Le QR code du billet n’a pas d’équivalent lisible par une machine autre que le code du billet, affiché en texte et épelable.</li>
          <li>La recherche d’adresses dépend d’un service externe : en cas d’indisponibilité, seuls les lieux suggérés restent proposés.</li>
        </ul>
      </Block>

      <Block title="Environnement de test">
        <p>
          Vérifications réalisées avec Chrome et Safari sur macOS, au clavier seul et avec VoiceOver. Outils prévus : axe DevTools et Lighthouse. <ToFill>résultats de l’audit</ToFill>
        </p>
      </Block>

      <Block title="Retour d’information et contact">
        <p>
          Si vous n’arrivez pas à accéder à un contenu ou à un service, signalez-le-nous : nous vous proposerons une alternative accessible ou une réponse sous une autre forme.
        </p>
        <p>
          <Link to="/aide#signaler" className="font-medium text-accent underline underline-offset-4">
            Signaler un problème d’accès
          </Link>
        </p>
      </Block>

      <Block title="Voies de recours">
        <p>
          Si vous nous avez signalé un défaut d’accessibilité sans obtenir de réponse satisfaisante, vous pouvez saisir le Défenseur des droits : par son formulaire en ligne, en contactant un délégué de votre région, ou par courrier gratuit (Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07).
        </p>
      </Block>
    </InfoPage>
  )
}
