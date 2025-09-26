# Data Model: AI Coding Assistant Experience Platform

## Core Entities

### User
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    github_id INTEGER UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);
```

**Fields**:
- `github_id`: GitHub user ID from OAuth
- `username`: GitHub username
- `email`: User email from GitHub (optional)
- `avatar_url`: GitHub profile picture URL
- `bio`: User-provided biography
- `created_at/updated_at`: Audit timestamps
- `last_login`: Track user activity

**Validation Rules**:
- GitHub ID must be unique and positive
- Username required, max 255 characters
- Email format validation if provided

### Experience Entry
```sql
CREATE TABLE experiences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    ai_assistant_type VARCHAR(100) NOT NULL,
    tags TEXT[], -- PostgreSQL array
    github_urls TEXT[], -- Array of GitHub URLs
    is_news BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields**:
- `user_id`: Foreign key to users table
- `title`: Experience title (max 500 chars)
- `description`: Detailed experience description
- `ai_assistant_type`: GitHub Copilot, ChatGPT, Claude, Amazon Q, etc.
- `tags`: Array of keyword tags
- `github_urls`: Array of validated GitHub URLs
- `is_news`: Distinguishes news items from experiences
- Audit timestamps

**Validation Rules**:
- Title and description required
- AI assistant type from predefined list
- GitHub URLs must match github.com domain pattern
- Tags array max 10 items, each max 50 characters

### Prompt
```sql
CREATE TABLE prompts (
    id SERIAL PRIMARY KEY,
    experience_id INTEGER REFERENCES experiences(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    context TEXT,
    results_achieved TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Fields**:
- `experience_id`: Links to parent experience
- `content`: The actual prompt text
- `context`: Situation where prompt was used
- `results_achieved`: Outcome description
- `created_at`: Creation timestamp

**Validation Rules**:
- Content required, max 5000 characters
- Context and results optional, max 2000 characters each

### Comment
```sql
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    experience_id INTEGER REFERENCES experiences(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Fields**:
- `user_id`: Comment author
- `experience_id`: Target experience
- `content`: Comment text
- Audit timestamps

**Validation Rules**:
- Content required, max 1000 characters
- No nested comments (flat structure)

### Reaction
```sql
CREATE TABLE reactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    experience_id INTEGER REFERENCES experiences(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, experience_id, reaction_type)
);
```

**Fields**:
- `user_id`: User giving reaction
- `experience_id`: Target experience
- `reaction_type`: like, helpful, bookmark
- Unique constraint prevents duplicate reactions

**Validation Rules**:
- Reaction type from predefined list: like, helpful, bookmark
- One reaction per user per experience per type

### Prompt Rating
```sql
CREATE TABLE prompt_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    prompt_id INTEGER REFERENCES prompts(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, prompt_id)
);
```

**Fields**:
- `user_id`: User providing rating
- `prompt_id`: Target prompt
- `rating`: 1-5 scale rating
- Unique constraint prevents duplicate ratings

**Validation Rules**:
- Rating must be integer between 1 and 5
- One rating per user per prompt

## Relationships

### One-to-Many
- User → Experiences (user can create multiple experiences)
- User → Comments (user can comment multiple times)
- User → Reactions (user can react to multiple experiences)
- User → Prompt Ratings (user can rate multiple prompts)
- Experience → Prompts (experience can have multiple prompts)
- Experience → Comments (experience can receive multiple comments)
- Experience → Reactions (experience can receive multiple reactions)
- Prompt → Ratings (prompt can receive multiple ratings)

### Constraints
- Cascade delete: When user deleted, all their content deleted
- Cascade delete: When experience deleted, all related prompts/comments/reactions deleted
- Foreign key constraints ensure referential integrity

## Indexes

### Performance Indexes
```sql
-- Search and filtering
CREATE INDEX idx_experiences_ai_assistant ON experiences(ai_assistant_type);
CREATE INDEX idx_experiences_created_at ON experiences(created_at DESC);
CREATE INDEX idx_experiences_tags ON experiences USING GIN(tags);
CREATE INDEX idx_experiences_user_id ON experiences(user_id);

-- Full-text search
CREATE INDEX idx_experiences_search ON experiences USING GIN(
    to_tsvector('english', title || ' ' || description)
);

-- User activity
CREATE INDEX idx_comments_experience ON comments(experience_id);
CREATE INDEX idx_reactions_experience ON reactions(experience_id);
CREATE INDEX idx_prompt_ratings_prompt ON prompt_ratings(prompt_id);
```

## Data Retention

### Cleanup Strategy
```sql
-- Soft delete approach
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE experiences ADD COLUMN deleted_at TIMESTAMP;

-- Cleanup job (runs daily)
UPDATE users SET deleted_at = NOW() 
WHERE created_at < NOW() - INTERVAL '2 years' 
AND deleted_at IS NULL;

-- Hard delete after grace period
DELETE FROM users 
WHERE deleted_at < NOW() - INTERVAL '30 days';
```

**Rules**:
- Data older than 2 years marked for deletion
- 30-day grace period before hard delete
- User can export data before deletion
- Audit log tracks all deletions