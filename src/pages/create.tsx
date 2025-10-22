import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import { Plus, X, Github } from 'lucide-react';

interface PromptForm {
  id: string;
  content: string;
  context: string;
  resultsAchieved: string;
}

const AI_ASSISTANTS = ['github-copilot', 'claude', 'gpt', 'cursor', 'other'];

export default function CreateExperience() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [aiAssistantType, setAiAssistantType] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [githubUrls, setGithubUrls] = useState<string[]>(['']);
  const [isNews, setIsNews] = useState(false);
  const [prompts, setPrompts] = useState<PromptForm[]>([
    { id: '1', content: '', context: '', resultsAchieved: '' },
  ]);

  // Tag management
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 10) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // GitHub URL management
  const addGithubUrl = () => {
    if (githubUrls.length < 5) {
      setGithubUrls([...githubUrls, '']);
    }
  };

  const updateGithubUrl = (index: number, value: string) => {
    const updated = [...githubUrls];
    updated[index] = value;
    setGithubUrls(updated);
  };

  const removeGithubUrl = (index: number) => {
    if (githubUrls.length > 1) {
      setGithubUrls(githubUrls.filter((_, i) => i !== index));
    }
  };

  // Prompt management
  const addPrompt = () => {
    if (prompts.length < 10) {
      setPrompts([
        ...prompts,
        {
          id: Date.now().toString(),
          content: '',
          context: '',
          resultsAchieved: '',
        },
      ]);
    }
  };

  const updatePrompt = (id: string, field: keyof PromptForm, value: string) => {
    setPrompts(
      prompts.map((prompt) =>
        prompt.id === id ? { ...prompt, [field]: value } : prompt
      )
    );
  };

  const removePrompt = (id: string) => {
    if (prompts.length > 1) {
      setPrompts(prompts.filter((prompt) => prompt.id !== id));
    }
  };

  const validateGithubUrl = (url: string) => {
    if (!url) return true; // Empty URLs are allowed
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname === 'github.com';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validation
      if (!title.trim()) {
        throw new Error('Title is required');
      }
      if (!description.trim()) {
        throw new Error('Description is required');
      }
      if (!aiAssistantType) {
        throw new Error('AI Assistant type is required');
      }

      const validGithubUrls = githubUrls.filter((url) => url.trim());
      for (const url of validGithubUrls) {
        if (!validateGithubUrl(url)) {
          throw new Error('All GitHub URLs must be valid github.com URLs');
        }
      }

      const validPrompts = prompts.filter((prompt) => prompt.content.trim());
      if (validPrompts.length === 0) {
        throw new Error('At least one prompt is required');
      }

      // Submit experience
      const response = await fetch('/api/experiences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          aiAssistantType,
          tags,
          githubUrls: validGithubUrls,
          isNews,
          prompts: validPrompts.map((prompt) => ({
            content: prompt.content.trim(),
            context: prompt.context.trim() || undefined,
            resultsAchieved: prompt.resultsAchieved.trim() || undefined,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.details && Array.isArray(errorData.details)) {
          throw new Error(`${errorData.error}\n\nDetails:\n${errorData.details.join('\n')}`);
        }
        throw new Error(errorData.error || 'Failed to create experience');
      }

      const { experience } = await response.json();
      router.push(`/experiences/${experience.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout>
        <Head>
          <title>
            Create Experience - AI Coding Assistant Experience Platform
          </title>
        </Head>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Sign in to share your experience
          </h1>
          <p className="text-gray-600 mb-8">
            You need to be signed in to share your AI coding assistant
            experiences.
          </p>
          <a
            href="/api/auth/signin"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in with GitHub
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>
          Create Experience - AI Coding Assistant Experience Platform
        </title>
        <meta
          name="description"
          content="Share your AI coding assistant experience with the community"
        />
      </Head>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">
              Share Your AI Coding Experience
            </h1>

            {error && (
              <div className="mb-6 p-4 border border-red-200 rounded-md bg-red-50">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Basic Information
                </h2>

                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Title * <span className="text-xs text-gray-500">(minimum 5 characters)</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      title.length > 0 && title.length < 5 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="e.g., Building a React component with GitHub Copilot"
                    maxLength={200}
                    required
                  />
                  <p className={`text-xs mt-1 ${
                    title.length > 0 && title.length < 5 
                      ? 'text-red-600' 
                      : 'text-gray-500'
                  }`}>
                    {title.length}/200 characters {title.length > 0 && title.length < 5 ? '(minimum 5 required)' : ''}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Description * <span className="text-xs text-gray-500">(minimum 20 characters)</span>
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none ${
                      description.length > 0 && description.length < 20 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Describe your experience, what you were trying to achieve, and how the AI assistant helped..."
                    maxLength={2000}
                    required
                  />
                  <p className={`text-xs mt-1 ${
                    description.length > 0 && description.length < 20 
                      ? 'text-red-600' 
                      : 'text-gray-500'
                  }`}>
                    {description.length}/2000 characters {description.length > 0 && description.length < 20 ? '(minimum 20 required)' : ''}
                  </p>
                </div>

                {/* AI Assistant Type */}
                <div>
                  <label
                    htmlFor="aiAssistant"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    AI Assistant *
                  </label>
                  <select
                    id="aiAssistant"
                    value={aiAssistantType}
                    onChange={(e) => setAiAssistantType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select an AI assistant</option>
                    {AI_ASSISTANTS.map((assistant) => (
                      <option key={assistant} value={assistant}>
                        {assistant}
                      </option>
                    ))}
                  </select>
                </div>

                {/* News Toggle */}
                <div className="flex items-center">
                  <input
                    id="isNews"
                    type="checkbox"
                    checked={isNews}
                    onChange={(e) => setIsNews(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isNews"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    This is news or an announcement
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">Tags</h2>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addTag())
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add a tag..."
                    maxLength={30}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!newTag.trim() || tags.length >= 10}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Add up to 10 tags to help others find your experience
                </p>
              </div>

              {/* GitHub URLs */}
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">
                  GitHub Repositories * <span className="text-xs text-gray-500">(at least one required)</span>
                </h2>

                {githubUrls.map((url, index) => (
                  <div key={index} className="flex space-x-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Github className="h-4 w-4 text-gray-400" />
                        <input
                          type="url"
                          value={url}
                          onChange={(e) =>
                            updateGithubUrl(index, e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://github.com/username/repository"
                        />
                      </div>
                      {url && !validateGithubUrl(url) && (
                        <p className="text-xs text-red-600 mt-1">
                          Must be a valid github.com URL
                        </p>
                      )}
                    </div>
                    {githubUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGithubUrl(index)}
                        className="px-3 py-2 text-gray-400 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                {githubUrls.length < 5 && (
                  <button
                    type="button"
                    onClick={addGithubUrl}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add another repository
                  </button>
                )}
              </div>

              {/* Prompts */}
              <div className="space-y-6">
                <h2 className="text-lg font-medium text-gray-900">Prompts</h2>

                {prompts.map((prompt, index) => (
                  <div
                    key={prompt.id}
                    className="border border-gray-200 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-md font-medium text-gray-800">
                        Prompt {index + 1}
                      </h3>
                      {prompts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePrompt(prompt.id)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Context */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Context (optional)
                      </label>
                      <textarea
                        value={prompt.context}
                        onChange={(e) =>
                          updatePrompt(prompt.id, 'context', e.target.value)
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="What was the situation or problem you were trying to solve?"
                        maxLength={500}
                      />
                    </div>

                    {/* Prompt Content */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prompt * <span className="text-xs text-gray-500">(minimum 10 characters)</span>
                      </label>
                      <textarea
                        value={prompt.content}
                        onChange={(e) =>
                          updatePrompt(prompt.id, 'content', e.target.value)
                        }
                        rows={4}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none font-mono ${
                          prompt.content.length > 0 && prompt.content.length < 10 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-300'
                        }`}
                        placeholder="Enter the exact prompt you used with the AI assistant..."
                        maxLength={5000}
                        required
                      />
                      <p className={`text-xs mt-1 ${
                        prompt.content.length > 0 && prompt.content.length < 10 
                          ? 'text-red-600' 
                          : 'text-gray-500'
                      }`}>
                        {prompt.content.length}/5000 characters {prompt.content.length > 0 && prompt.content.length < 10 ? '(minimum 10 required)' : ''}
                      </p>
                    </div>

                    {/* Results */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Results Achieved (optional)
                      </label>
                      <textarea
                        value={prompt.resultsAchieved}
                        onChange={(e) =>
                          updatePrompt(
                            prompt.id,
                            'resultsAchieved',
                            e.target.value
                          )
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="What did you achieve with this prompt? How did it help?"
                        maxLength={500}
                      />
                    </div>
                  </div>
                ))}

                {prompts.length < 10 && (
                  <button
                    type="button"
                    onClick={addPrompt}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add another prompt
                  </button>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Share Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
