# Présentation du Workflow Specify - Système de Développement Assisté par IA

## Vue d'ensemble

**Specify** est un système complet de développement dirigé par les spécifications qui transforme des descriptions en langage naturel en fonctionnalités implémentées, en suivant une méthodologie rigoureuse basée sur TDD et la gouvernance constitutionnelle.

### Philosophie

- **Spécification d'abord** : Tout commence par une spec claire avant toute implémentation
- **Constitution project** : Principes non-négociables qui gouvernent le développement
- **Test-Driven Development** : Tests écrits et validés avant l'implémentation
- **Traçabilité complète** : De la description utilisateur au code en passant par la spec, le plan et les tâches
- **Collaboration IA** : Workflows optimisés pour les assistants IA (Claude, Copilot, etc.)

---

## Architecture du Système

### Structure des Répertoires

```
.specify/
├── memory/
│   └── constitution.md          # Principes du projet
├── templates/
│   ├── spec-template.md         # Template de spécification
│   ├── plan-template.md         # Template de plan d'implémentation
│   ├── tasks-template.md        # Template de liste de tâches
│   └── agent-file-template.md   # Template pour fichiers agent
├── features/[###-feature-name]/ # Dossier par feature
│   ├── spec.md                  # Spécification
│   ├── plan.md                  # Plan d'implémentation
│   ├── research.md              # Recherche technique
│   ├── data-model.md            # Modèle de données
│   ├── quickstart.md            # Scénarios de test
│   ├── contracts/               # Contrats API
│   └── tasks.md                 # Liste des tâches
└── scripts/bash/                # Scripts utilitaires
```

### Fichiers de Sortie Agent

Le système génère automatiquement des fichiers de contexte pour différents agents IA :
- `CLAUDE.md` pour Claude Code
- `.github/copilot-instructions.md` pour GitHub Copilot
- `GEMINI.md` pour Gemini CLI
- `QWEN.md` pour Qwen Code
- `AGENTS.md` pour opencode

---

## Les 7 Custom Commands

### 1. `/specify` - Créer la Spécification

**Rôle** : Transformer une description en langage naturel en spécification formelle

**Flux d'exécution** :
1. Crée une nouvelle branche feature (`###-feature-name`)
2. Parse la description utilisateur
3. Génère `spec.md` en suivant le template
4. Identifie les ambiguïtés avec `[NEEDS CLARIFICATION]`
5. Définit les user stories et acceptance criteria
6. Liste les exigences fonctionnelles (testables)

**Sortie** :
- Branche feature créée
- `specs/###-feature-name/spec.md`

**Exemple d'utilisation** :
```bash
/specify Système d'authentification avec email et mot de passe
```

**Points clés** :
- ✅ Focus sur le QUOI et POURQUOI (pas le COMMENT)
- ❌ Aucun détail d'implémentation (pas de tech stack)
- 👥 Écrit pour les stakeholders non-techniques
- 🔍 Marque explicitement les zones ambiguës

---

### 2. `/clarify` - Résoudre les Ambiguïtés

**Rôle** : Identifier et résoudre les zones sous-spécifiées avant la planification

**Flux d'exécution** :
1. Charge `spec.md` de la feature active
2. Scan structuré selon une taxonomie complète :
   - Scope & comportement fonctionnel
   - Modèle de données & domaine
   - Interactions & flux UX
   - Attributs non-fonctionnels (performance, scalabilité, sécurité)
   - Intégrations & dépendances externes
   - Cas limites & gestion d'erreurs
   - Contraintes & tradeoffs
   - Terminologie & cohérence
3. Génère max 5 questions ciblées (haute priorité)
4. Pose les questions **une à la fois** (mode interactif)
5. Intègre **immédiatement** chaque réponse dans la spec
6. Met à jour les sections appropriées

**Sortie** :
- `spec.md` enrichie avec section `## Clarifications`
- Ambiguïtés résolues directement dans les sections concernées
- Rapport de couverture par catégorie

**Exemple de questions** :
| Option | Description |
|--------|-------------|
| A | Email/Mot de passe uniquement |
| B | OAuth (Google, GitHub) |
| C | SSO entreprise (SAML) |

**Points clés** :
- 🎯 Maximum 5 questions par session
- 🔄 Mise à jour incrémentale (après chaque réponse)
- 📊 Couverture multidimensionnelle
- ⚠️ **DOIT** être exécuté avant `/plan`

---

### 3. `/plan` - Planifier l'Implémentation

**Rôle** : Transformer la spec en plan technique détaillé avec recherche et design

**Flux d'exécution** :
1. Vérifie que la spec a des clarifications (sinon recommande `/clarify`)
2. Charge la spec et la constitution
3. Détecte le type de projet (single/web/mobile)
4. **Phase 0 - Research** :
   - Identifie les `NEEDS CLARIFICATION` techniques
   - Recherche les best practices
   - Génère `research.md` avec décisions/rationales
5. **Phase 1 - Design** :
   - Extrait les entités → `data-model.md`
   - Génère les contrats API → `contracts/`
   - Crée les tests de contrats (qui échouent)
   - Extrait les scénarios → `quickstart.md`
   - Met à jour le fichier agent (CLAUDE.md, etc.)
6. Vérifie la conformité constitutionnelle (2x)
7. **Phase 2 - Planning** : Décrit l'approche de génération de tâches

**Sortie** :
- `plan.md` (ce fichier)
- `research.md`
- `data-model.md`
- `contracts/*.yaml` ou `*.graphql`
- `quickstart.md`
- Tests de contrats (failing)
- Fichier agent mis à jour

**Points clés** :
- 🔬 Recherche technique automatisée
- 📐 Design avant implémentation
- ✅ Double vérification constitutionnelle
- 🛑 **S'ARRÊTE** à la phase 2 (pas de tasks.md)

---

### 4. `/tasks` - Générer la Liste de Tâches

**Rôle** : Créer une liste ordonnée et exécutable de tâches d'implémentation

**Flux d'exécution** :
1. Charge tous les artefacts de design disponibles :
   - `plan.md` (obligatoire)
   - `data-model.md` (si existe)
   - `contracts/` (si existe)
   - `research.md` (si existe)
   - `quickstart.md` (si existe)
2. Génère des tâches selon les règles :
   - Chaque contrat → tâche de test `[P]`
   - Chaque entité → tâche de modèle `[P]`
   - Chaque endpoint → tâche d'implémentation
   - Chaque user story → test d'intégration
3. Ordonne par dépendances :
   - Setup → Tests → Core → Integration → Polish
   - TDD : tests avant implémentation
   - Modèles avant services avant UI
4. Marque `[P]` pour les tâches parallélisables

**Sortie** :
- `tasks.md` avec tâches numérotées (T001, T002...)

**Exemple de tâche** :
```markdown
### T003: Create User Model [P]
**File**: `backend/src/models/user.py`
**Dependencies**: T001 (Setup)
**Parallel**: Yes (independent file)

Create User entity with fields from data-model.md:
- id, email, password_hash, created_at
- Validation: email format, password strength
```

**Points clés** :
- 📋 Tâches immédiatement exécutables
- 🔗 Dépendances explicites
- ⚡ Support d'exécution parallèle
- 🎯 Chemins de fichiers précis

---

### 5. `/implement` - Exécuter l'Implémentation

**Rôle** : Exécuter toutes les tâches de `tasks.md` dans l'ordre

**Flux d'exécution** :
1. Charge le contexte complet :
   - `tasks.md` (obligatoire)
   - `plan.md` (obligatoire)
   - Tous les docs de design disponibles
2. Parse la structure de `tasks.md` :
   - Phases de tâches
   - Dépendances
   - Marqueurs `[P]` pour parallélisation
3. Exécute phase par phase :
   - **Setup** : Init projet, dépendances, config
   - **Tests** : Tests de contrats, entités, intégration
   - **Core** : Modèles, services, endpoints
   - **Integration** : DB, middleware, logging
   - **Polish** : Tests unitaires, perf, docs
4. Respecte les dépendances :
   - Tâches séquentielles dans l'ordre
   - Tâches `[P]` peuvent s'exécuter ensemble
5. Marque chaque tâche complétée `[X]` dans tasks.md

**Sortie** :
- Code implémenté
- Tests passants
- `tasks.md` mis à jour avec statuts

**Points clés** :
- 🏗️ Exécution phase par phase
- ✅ Approche TDD stricte
- ⚡ Parallélisation automatique où possible
- 🛑 Arrêt en cas d'échec de tâche critique
- 📝 Tracking en temps réel

---

### 6. `/analyze` - Analyser la Cohérence

**Rôle** : Vérifier la cohérence cross-artifacts après génération des tâches

**Flux d'exécution** :
1. Charge les 3 artefacts principaux :
   - `spec.md`
   - `plan.md`
   - `tasks.md`
2. Charge `constitution.md` (autorité non-négociable)
3. Construit des modèles sémantiques :
   - Inventaire des requirements
   - Inventaire des user stories
   - Mapping tâches → requirements
   - Règles constitutionnelles
4. Passes de détection :
   - **Duplication** : Requirements redondants
   - **Ambiguïté** : Adjectifs vagues, placeholders
   - **Sous-spécification** : Requirements sans outcome mesurable
   - **Alignement constitutionnel** : Violations de principes MUST
   - **Gaps de couverture** : Requirements sans tâches
   - **Inconsistance** : Dérives terminologiques, contradictions
5. Assigne une sévérité (CRITICAL/HIGH/MEDIUM/LOW)
6. Génère un rapport structuré

**Sortie** :
- Rapport Markdown (pas de fichier écrit)
- Table de findings avec recommandations
- Métriques de couverture
- Suggestions d'actions

**Exemple de rapport** :
```markdown
### Specification Analysis Report
| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| A1 | Duplication | HIGH | spec.md:L120-134 | Two similar auth requirements | Merge; keep clearer version |
| C2 | Constitution | CRITICAL | plan.md:L45 | Uses 4th project (violates simplicity) | Justify or consolidate |
| G3 | Coverage | MEDIUM | FR-009 (performance) | No performance test tasks | Add perf validation task |

**Metrics**:
- Total Requirements: 15
- Total Tasks: 28
- Coverage: 93% (14/15 requirements have tasks)
- Critical Issues: 1
```

**Points clés** :
- 📊 **STRICTEMENT LECTURE SEULE** (aucun fichier modifié)
- 🔍 Détection multi-dimensionnelle
- 🏛️ Constitution = autorité suprême
- 🎯 Exécuter **après** `/tasks`, **avant** `/implement`
- 💡 Propose des remediations (mais ne les applique pas)

---

### 7. `/constitution` - Gérer la Constitution

**Rôle** : Créer ou mettre à jour la constitution du projet

**Flux d'exécution** :
1. Charge le template `constitution.md`
2. Identifie les placeholders `[ALL_CAPS_IDENTIFIER]`
3. Collecte les valeurs :
   - Input utilisateur (conversation)
   - Inférence depuis le repo (README, docs)
   - Questions interactives si manquant
4. Gère le versioning sémantique :
   - MAJOR : Changements incompatibles
   - MINOR : Nouveaux principes
   - PATCH : Clarifications
5. Remplace tous les placeholders
6. Propage les changements :
   - Vérifie `plan-template.md`
   - Vérifie `spec-template.md`
   - Vérifie `tasks-template.md`
   - Vérifie les fichiers de commandes
7. Génère un rapport de synchronisation
8. Écrit le fichier mis à jour

**Sortie** :
- `constitution.md` complétée
- Rapport d'impact (en commentaire HTML)
- Message de commit suggéré

**Structure de la Constitution** :
```markdown
# [PROJECT_NAME] Constitution

## Core Principles
### I. Library-First
Chaque feature commence comme bibliothèque standalone...

### II. CLI Interface
Toute bibliothèque expose sa fonctionnalité via CLI...

### III. Test-First (NON-NEGOTIABLE)
TDD obligatoire : Tests → Approbation → Red → Green...

### IV. Integration Testing
Focus : contrats de bibliothèques, changements...

### V. Observability / Versioning / Simplicity
...

## Governance
Constitution supersede toutes les autres pratiques...

**Version**: 2.1.1 | **Ratified**: 2025-06-13 | **Last Amended**: 2025-10-10
```

**Points clés** :
- 🏛️ Définit les règles **non-négociables**
- 📏 Versioning sémantique strict
- 🔗 Synchronisation avec tous les templates
- 📝 Support de principes variables (pas fixé à 5)

---

## Workflow Complet : De l'Idée au Code

### Scénario Idéal

```
1. Idée utilisateur
   ↓
2. /specify "Description en langage naturel"
   → Génère spec.md avec ambiguïtés marquées
   ↓
3. /clarify (interactive)
   → Pose jusqu'à 5 questions ciblées
   → Enrichit spec.md au fur et à mesure
   ↓
4. /plan
   → Research technique (research.md)
   → Design (data-model.md, contracts/, quickstart.md)
   → Vérifie constitution 2x
   ↓
5. /tasks
   → Génère liste ordonnée de tâches
   → Marque parallélisation [P]
   ↓
6. /analyze (optionnel mais recommandé)
   → Vérifie cohérence spec/plan/tasks
   → Identifie violations constitutionnelles
   → Suggère corrections
   ↓
7. /implement
   → Exécute toutes les tâches
   → TDD strict
   → Marque progression [X]
   ↓
8. Feature complète !
```

### Points de Contrôle (Gates)

- **Après /specify** : Spec compréhensible par non-tech ?
- **Après /clarify** : Zéro `[NEEDS CLARIFICATION]` restant ?
- **Après /plan** : Constitution Check PASS (2x) ?
- **Après /tasks** : Toutes les requirements ont des tâches ?
- **Après /analyze** : Zéro issues CRITICAL ?
- **Après /implement** : Tous les tests passent ?

---

## Principes Clés du Système

### 1. Séparation QUOI vs COMMENT

- **Spec (QUOI)** : Langage business, zéro tech
- **Plan (COMMENT)** : Décisions techniques, architecture
- **Tasks (QUAND/OÙ)** : Ordre d'exécution, fichiers précis

### 2. Test-Driven Development (TDD)

- Tests écrits **avant** l'implémentation
- Approbation utilisateur **avant** implémentation
- Cycle Red → Green → Refactor strict

### 3. Constitution comme Autorité

- Principes **non-négociables**
- Vérifications automatiques (`/plan`, `/analyze`)
- Violations doivent être **justifiées** explicitement

### 4. Traçabilité Complète

```
User Input
  → Spec (requirements)
    → Plan (technical decisions)
      → Tasks (actionable items)
        → Code (implementation)
```

Chaque niveau référence le précédent.

### 5. Optimisation pour l'IA

- Templates exécutables (avec `## Execution Flow`)
- Placeholders explicites
- Gates et validations automatiques
- Fichiers agent auto-générés (CLAUDE.md, etc.)

---

## Cas d'Usage Avancés

### 1. Projet Multi-Plateformes

Le système détecte automatiquement :
- **Single** : `src/` + `tests/`
- **Web** : `backend/` + `frontend/`
- **Mobile** : `api/` + `ios/` ou `android/`

Adaptation automatique de la structure dans `plan.md`.

### 2. Exécution Parallèle

Marquage `[P]` pour tâches indépendantes :
```markdown
T005: Create User Model [P]
T006: Create Product Model [P]
T007: Create Order Model [P]
```

Ces 3 tâches peuvent s'exécuter simultanément (fichiers différents).

### 3. Constitution Custom

Adapté à votre domaine :
```markdown
### VI. HIPAA Compliance
Toutes les données patient doivent être chiffrées au repos et en transit.
Audit trail obligatoire pour tout accès aux données sensibles.
```

### 4. Recherche Technique Automatisée

Phase 0 de `/plan` :
- Détecte `NEEDS CLARIFICATION` techniques
- Dispatche des agents de recherche
- Consolide dans `research.md`
- Résout automatiquement les choix tech

---

## Scripts Utilitaires

### `create-new-feature.sh`

Appelé par `/specify` :
- Crée la branche feature
- Initialise le dossier `specs/###-feature-name/`
- Retourne JSON avec chemins absolus

### `setup-plan.sh`

Appelé par `/plan` :
- Vérifie que spec existe
- Copie le template de plan
- Retourne JSON avec chemins

### `check-prerequisites.sh`

Utilisé par `/clarify`, `/tasks`, `/analyze`, `/implement` :

Modes :
- `--json` : Retourne JSON structuré
- `--paths-only` : Retourne uniquement FEATURE_DIR et FEATURE_SPEC
- `--require-tasks` : Exige que tasks.md existe
- `--include-tasks` : Inclut tasks.md dans AVAILABLE_DOCS

### `update-agent-context.sh`

Appelé par `/plan` (Phase 1) :
- Argument : `claude` ou `copilot` ou `gemini` etc.
- Met à jour incrémentalement (O(1))
- Préserve les additions manuelles
- Garde <150 lignes pour efficacité token

---

## Comparaison avec D'autres Approches

| Aspect | Specify Workflow | Waterfall classique | Agile standard |
|--------|------------------|---------------------|----------------|
| **Spec** | Obligatoire, formelle, template | Documents lourds | User stories light |
| **Clarification** | Interactive, 5Q max, intégrée | Longues réunions | Backlog grooming |
| **Constitution** | Principes non-négociables | Standards guide | Team agreement |
| **TDD** | Strict, gate-checked | Optionnel | Recommandé |
| **Traçabilité** | Automatique (spec→plan→tasks→code) | Manuelle (docs) | Tracking tools |
| **IA Integration** | Natif (templates exécutables) | Aucune | Assistants externes |
| **Parallélisation** | Explicite ([P] markers) | N/A | Sprint planning |

---

## Métriques de Succès

### Au Niveau Feature

- **Couverture** : % de requirements avec ≥1 tâche
- **Clarté** : Nombre de `[NEEDS CLARIFICATION]` résolus
- **Conformité** : Issues constitutionnelles (cible : 0 CRITICAL)
- **Qualité** : Tests passants / Tests totaux

### Au Niveau Projet

- **Vélocité** : Features complétées par sprint
- **Dette technique** : Violations constitutionnelles justifiées
- **Maintenance** : Fichiers agent maintenus (<150 lignes)
- **Consistance** : Dérives terminologiques détectées

---

## Évolutions Futures Recommandées

### Court Terme

1. **Dashboard de monitoring** :
   - Statut de toutes les features en cours
   - Métriques de couverture en temps réel
   - Alertes sur violations constitutionnelles

2. **Integration CI/CD** :
   - Hook pre-commit pour `/analyze`
   - Validation automatique des specs
   - Génération de rapports de conformité

3. **Templates de domaine** :
   - Constitution par industrie (HIPAA, RGPD, finance)
   - Spec templates spécialisés (ML, crypto, IoT)

### Moyen Terme

4. **Multi-agent orchestration** :
   - Recherche parallèle en Phase 0
   - Design collaboratif en Phase 1
   - Implémentation distribuée en Phase 4

5. **Versioning de specs** :
   - Diff de specs entre versions
   - Migration de features existantes
   - Rétrocompatibilité automatique

6. **Learning system** :
   - Patterns de clarifications fréquents
   - Détection proactive d'ambiguïtés
   - Suggestions de questions améliorées

### Long Terme

7. **Certification de conformité** :
   - Score de qualité de spec
   - Badge de conformité constitutionnelle
   - Export pour audits

8. **Marketplace de constitutions** :
   - Bibliothèque de principes par domaine
   - Communauté de best practices
   - Templates certifiés

---

## Conclusion

Le **Specify Workflow** n'est pas juste un système de commandes, c'est une **méthodologie complète** qui :

✅ **Garantit la qualité** via la constitution et les gates
✅ **Réduit les ambiguïtés** via `/clarify` interactif
✅ **Automatise la traçabilité** de l'idée au code
✅ **Optimise la collaboration IA** via templates exécutables
✅ **Impose TDD** de manière non-négociable
✅ **Détecte les incohérences** via `/analyze`

**Pour qui ?**
- Équipes souhaitant rigueur + vélocité
- Projets avec exigences fortes (compliance, sécurité)
- Développeurs utilisant assistants IA (Claude, Copilot)
- Organisations voulant standardiser leur approche

**Pourquoi c'est différent ?**
- Constitution > Conventions
- Clarification proactive > Assumptions
- TDD strict > Tests après coup
- Traçabilité automatique > Documentation manuelle

---

## Annexes

### A. Glossary

- **Feature** : Unité de travail avec sa propre branche, spec, plan, tasks
- **Spec** : Spécification fonctionnelle (QUOI), sans détails techniques
- **Plan** : Spécification technique (COMMENT), avec stack et architecture
- **Constitution** : Ensemble de principes non-négociables du projet
- **Gate** : Point de validation obligatoire (ex: Constitution Check)
- **Clarification** : Question ciblée pour résoudre une ambiguïté
- **Contract** : Spécification d'API (OpenAPI, GraphQL schema)
- **Agent file** : Fichier de contexte pour assistant IA (CLAUDE.md, etc.)
- **[P]** : Marqueur de parallélisation (tâche exécutable en parallèle)

### B. Templates Disponibles

1. `spec-template.md` : Spécification feature
2. `plan-template.md` : Plan d'implémentation
3. `tasks-template.md` : Liste de tâches
4. `agent-file-template.md` : Contexte agent
5. `constitution.md` : Constitution projet

### C. Scripts Bash

1. `create-new-feature.sh` : Init feature
2. `setup-plan.sh` : Init plan
3. `check-prerequisites.sh` : Validation pré-requis
4. `update-agent-context.sh` : MAJ fichier agent

### D. Exemples de Constitution

**Tech Startup** :
```markdown
I. Move Fast (ship features weekly)
II. User First (every decision validated by user feedback)
III. Data-Driven (instrument everything, A/B test)
```

**Enterprise Healthcare** :
```markdown
I. HIPAA Compliance (non-negotiable)
II. Audit Trail (every data access logged)
III. Zero Trust Security (assume breach, verify always)
```

**Open Source Library** :
```markdown
I. Backward Compatibility (semver strict)
II. Zero Dependencies (or explicit justification)
III. Documentation First (README before code)
```

---

**Auteur** : Système Specify Workflow
**Version du document** : 1.0
**Date** : 2025-10-10
**Licence** : À définir selon votre projet
