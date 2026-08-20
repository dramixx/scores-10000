# Spécifications fonctionnelles — Compteur de score "10000"

## 1. Présentation

Application permettant de tenir le score d'une partie du jeu de dés "10000" (aussi appelé "Yam's" ou "Farkle" selon les régions), à plusieurs joueurs, sur un même appareil. L'application ne simule pas les lancers de dés : les joueurs lancent de vrais dés et saisissent eux-mêmes le score obtenu à chaque tour. L'application se charge uniquement du calcul des totaux, de l'application des règles de score, et de la conservation de l'historique de la partie.

## 2. Règles du jeu de 10000

### 2.1 But du jeu

Être le premier joueur à atteindre ou dépasser 10000 points cumulés.

### 2.2 Déroulement d'un tour (hors application)

1. Le joueur lance 5 dés.
2. Après chaque lancer, il doit mettre de côté au moins un dé marquant des points.
3. Il peut ensuite :
   - Relancer les dés restants pour tenter de marquer plus de points ;
   - S'arrêter et conserver les points accumulés (sauf si les 5 dés marquent des points, auquel cas il doit continuer à lancer).
4. Si un lancer ne rapporte aucun point, le joueur perd tous les points accumulés durant ce tour et reçoit une "croix" (❌).

### 2.3 Combinaisons et valeurs de points

| Combinaison | Points |
|---|---|
| 1 isolé | 100 |
| 5 isolé | 50 |
| Brelan (trois dés identiques) | Valeur du dé × 100 (brelan de 1 = 1000) |
| Carré (quatre dés identiques) | Score du brelan correspondant × 2 |
| Suite (1-2-3-4-5 ou 2-3-4-5-6) | 1000 |
| Full (un brelan + une paire) | Somme des deux brelans équivalents |
| Yam (cinq dés identiques) | Score du carré correspondant × 2 |

Les combinaisons spéciales ne sont valables que si elles sont obtenues en un seul lancer.

### 2.4 Règles spéciales de score

- **Croix (❌)** : à chaque tour où le joueur ne marque aucun point (score de 0) alors qu'il a déjà un score cumulé supérieur à 0, il reçoit une croix.
- **Trois croix consécutives** : dès qu'un joueur atteint 3 croix consécutives, l'intégralité de son score du tour valide précédent est annulée (remis au score valide d'avant), et son compteur de croix repart de zéro.
- **Score identique à un adversaire** : si le score cumulé d'un joueur, après son tour, tombe exactement sur le score cumulé actuel d'un autre joueur, ce dernier perd son dernier tour valide (son score cumulé retombe à sa valeur précédente, comme s'il avait subi 3 croix). Cette règle s'applique à tous les adversaires concernés, y compris s'ils sont plusieurs à partager ce score.
- **Reprise des dés d'un adversaire** : un joueur peut continuer le tour du joueur précédent en relançant uniquement les dés qui n'avaient pas marqué de points (règle appliquée hors application, lors du lancer physique des dés).

### 2.5 Fin de partie

La partie se termine dès qu'un joueur atteint ou dépasse 10000 points ; ce joueur est déclaré vainqueur (voir [8. Fin de partie et victoire](#8-fin-de-partie-et-victoire)).

## 3. Création d'une partie

### 3.1 Choix du nombre de joueurs

L'utilisateur indique le nombre de joueurs qui participeront à la partie (valeur numérique, doit être strictement supérieure à 0).

### 3.2 Saisie des joueurs

- Un champ de saisie de nom est proposé pour chaque joueur (nombre de champs = nombre de joueurs choisi).
- Chaque nom est obligatoire (non vide après suppression des espaces en début/fin) ; la validation finale n'est possible que si tous les noms sont renseignés.
- L'ordre des joueurs peut être réorganisé librement avant de démarrer la partie (glisser-déposer des joueurs dans la liste). Cet ordre détermine l'ordre de passage pendant la partie.
- Une fois validée, la partie démarre : le premier joueur de la liste est désigné comme joueur actif, la partie est marquée comme "en cours", et aucun tour n'a encore été joué.

## 4. Déroulement de la partie

### 4.1 Tour de jeu

- Un seul joueur est actif à la fois, dans l'ordre défini au départ (rotation cyclique : après le dernier joueur, on revient au premier).
- Pour le joueur actif, l'utilisateur saisit soit :
  - Le score obtenu à ce tour (nombre entier, jusqu'à 10000) ;
  - Une "croix" (score nul), via une action dédiée équivalente à saisir 0.
- Après validation d'un score (ou d'une croix), le tour passe automatiquement au joueur suivant, sauf si ce score déclenche la fin de la partie (voir [8. Fin de partie et victoire](#8-fin-de-partie-et-victoire)).
- Le score saisi ne peut pas dépasser 10000 ; une saisie supérieure est refusée et un message d'erreur est affiché.

### 4.2 Calcul du score cumulé

- Le score cumulé d'un joueur à un tour donné correspond au score cumulé de son tour valide précédent, augmenté du score saisi à ce tour.
- Un tour marqué comme "annulé" (strikeout) n'est pas pris en compte comme référence pour le calcul du tour suivant : on se base sur le dernier tour non annulé.

### 4.3 Gestion des croix

- Si le score saisi est 0 alors que le score cumulé du joueur (avant ce tour) est supérieur à 0, le compteur de croix du joueur est incrémenté de 1 par rapport à son dernier tour valide.
- Si le score cumulé est encore à 0 (le joueur n'a jamais marqué), une saisie à 0 n'incrémente pas le compteur de croix.
- Dès que le compteur de croix atteint 3 sur un même score cumulé :
  - Ce tour et l'ensemble des tours ayant ce même score cumulé depuis le dernier tour valide (y compris ce dernier) sont marqués comme "annulés" ;
  - Le score effectif du joueur revient donc à son score cumulé valide antérieur ;
  - Le compteur de croix repart de zéro sur le tour suivant.

### 4.4 Egalité de score avec un adversaire

- Après le calcul du nouveau score du joueur actif, l'application vérifie, pour chacun des autres joueurs, si son dernier score cumulé valide est strictement positif et égal au nouveau score du joueur actif.
- Si c'est le cas, tous les tours de cet adversaire correspondant à ce score cumulé (depuis son dernier tour valide) sont marqués comme "annulés", ce qui fait retomber son score affiché à sa valeur valide précédente.
- Cette vérification est effectuée pour tous les adversaires concernés, indépendamment les uns des autres.

### 4.5 Annulation manuelle d'un score

- Un joueur (ou l'utilisateur qui saisit les scores) peut annuler manuellement un score déjà enregistré, en désignant la dernière entrée valide affichée pour un joueur donné (le score cumulé ainsi que le tour correspondant, et les tours partageant ce même score cumulé depuis le dernier tour valide, sont marqués comme annulés).
- Cette action n'est possible que sur le dernier tour valide d'un joueur (impossible d'annuler un tour déjà annulé, ou un tour qui n'est plus le plus récent tour valide).
- Un score nul (0) ne peut pas être annulé de cette manière.
- L'annulation manuelle nécessite une confirmation explicite avant application.

### 4.6 Historique et navigation (annuler / rétablir)

- Chaque action modifiant l'état de la partie (saisie de score, croix, annulation manuelle d'un score) crée un nouvel état dans l'historique de la partie.
- L'utilisateur peut annuler la dernière action ("Undo") pour revenir à l'état précédent de la partie.
- L'utilisateur peut rétablir une action précédemment annulée ("Redo"), tant qu'aucune nouvelle action n'a été effectuée entre-temps.
- Toute nouvelle action effectuée après un ou plusieurs "Undo" supprime la possibilité de "Redo" au-delà de ce nouvel état (les états "futurs" annulés sont perdus).
- Les actions "Undo"/"Redo" ne sont disponibles que lorsqu'un état antérieur/postérieur existe respectivement.

## 5. Affichage du tableau des scores

- Le tableau présente une colonne par joueur et une ligne par tour de jeu (les tours des différents joueurs au sein d'un même passage de la table sont regroupés sur la même ligne).
- Pour chaque tour joué et non annulé, sont visibles :
  - Le score cumulé du joueur après ce tour ;
  - Le score marqué lors de ce tour précis, si celui-ci est positif ;
  - Le nombre de croix accumulées à ce tour, le cas échéant.
- Un tour marqué comme "annulé" reste visible mais est signalé visuellement comme non valide (score barré), sans être supprimé de l'historique affiché.
- Le joueur actif est mis en évidence dans le tableau.

## 6. Sauvegarde et gestion des parties

### 6.1 Sauvegarde automatique

- Chaque partie créée est automatiquement sauvegardée, ainsi que son historique complet des états (pour permettre l'annulation/rétablissement même après avoir quitté puis rouvert la partie).
- Chaque action de jeu (score, croix, annulation, undo, redo) met à jour la sauvegarde immédiatement.

### 6.2 Liste des parties en cours

- L'écran d'accueil propose la liste des parties précédemment démarrées et **non terminées** (c'est-à-dire dont aucun joueur n'a encore atteint 10000 points), triées de la plus récemment jouée à la plus ancienne.
- Pour chaque partie de la liste sont affichés : la liste des noms des joueurs, et le temps écoulé depuis la dernière action jouée.
- Une partie peut être reprise depuis cette liste, ce qui restaure son état courant ainsi que son historique d'annulation/rétablissement.
- Une partie peut être supprimée directement depuis cette liste, après confirmation explicite de l'utilisateur (rappelant les noms des joueurs concernés).
- Une partie dont les données seraient invalides ou illisibles est affichée mais ne peut pas être reprise (uniquement supprimée).
- Une partie terminée (avec un vainqueur) n'apparaît plus dans cette liste, puisqu'elle ne peut plus être reprise pour y jouer un tour supplémentaire.

### 6.3 Nouvelle partie

- Depuis l'écran d'accueil, l'utilisateur peut démarrer une nouvelle partie en choisissant un nombre de joueurs, indépendamment des parties déjà sauvegardées.

## 7. Actions en cours de partie

### 7.1 Quitter la partie

- L'utilisateur peut quitter l'écran de partie à tout moment pour revenir à l'écran d'accueil. La partie reste sauvegardée dans son état courant et pourra être reprise plus tard.

### 7.2 Relancer une partie avec les mêmes joueurs

- L'utilisateur peut demander à démarrer une nouvelle partie reprenant exactement les mêmes joueurs, dans le même ordre, avec tous les scores remis à zéro.
- Cette action nécessite une confirmation explicite (l'utilisateur est prévenu que les scores seront réinitialisés).
- Une fois confirmée, une nouvelle partie distincte est créée (la partie précédente n'est pas supprimée, elle reste consultable/reprenable séparément) et devient la partie active.

### 7.3 Consultation des règles

- L'utilisateur peut, à tout moment pendant une partie, consulter les règles complètes du jeu (but du jeu, matériel nécessaire, déroulement d'un tour, règles spéciales, tableau des combinaisons et de leurs points, exemple de tour, condition de fin de partie) sans quitter la partie en cours.

## 8. Fin de partie et victoire

### 8.1 Détection de la victoire

- Dès que la validation d'un tour amène le score cumulé valide du joueur actif à 10000 points ou plus, la partie s'arrête immédiatement : ce joueur est déclaré vainqueur et aucun autre tour ne peut être joué (y compris pour les joueurs qui n'ont pas encore joué dans le passage en cours).
- La partie passe alors au statut "terminée" et n'est plus modifiable (plus de saisie de score, de croix, ni d'annulation manuelle possibles). L'historique "Undo/Redo" de la partie reste toutefois consultable pour revenir revoir un état antérieur, sans pouvoir repartir dans une nouvelle direction depuis un état passé.
- Si l'action gagnante est elle-même annulée via "Undo", la partie retrouve son statut "en cours" et redevient jouable normalement.

### 8.2 Écran de fin de partie

Dès qu'un vainqueur est déterminé, un écran de fin de partie est présenté automatiquement à la place de la zone de saisie de score. Il comprend :

- Une célébration visuelle de la victoire (effet de feux d'artifice) mettant en avant le nom du joueur vainqueur et son score final.
- Le classement final de tous les joueurs, du score le plus élevé au plus faible.
- Un ensemble de statistiques sur la partie qui vient de se dérouler (voir 8.3).
- Le tableau détaillé des scores de la partie reste consultable depuis cet écran.
- Deux actions rapides sont proposées : relancer une nouvelle partie avec les mêmes joueurs (voir 7.2), ou revenir à l'écran d'accueil.

### 8.3 Statistiques de fin de partie

À l'issue de la partie, les statistiques suivantes sont calculées et présentées :

- **Score final et classement** : score cumulé final de chaque joueur, et son rang.
- **Écart de victoire** : différence de points entre le vainqueur et le deuxième du classement.
- **Durée de la partie** : temps écoulé entre le premier et le dernier tour joué.
- **Nombre de tours joués** : nombre total de tours joués, toutes joueurs confondus, et nombre de tours par joueur.
- **Meilleur tour de la partie** : le score le plus élevé marqué en un seul tour (hors tours annulés), et le joueur qui l'a réalisé.
- **Score moyen par tour** : score moyen obtenu par tour valide (hors tours annulés et croix), pour chaque joueur.
- **Total de croix** : nombre total de croix (❌) reçues par chaque joueur pendant la partie.
- **Plus grosse infortune** : le plus grand nombre de points perdus d'un coup par un joueur (via 3 croix consécutives ou une égalité de score avec un adversaire), et le joueur concerné.
- **Retournements de situation** : nombre de fois où le joueur en tête du classement a changé au cours de la partie.
