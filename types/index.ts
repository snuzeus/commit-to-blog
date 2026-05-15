export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

export interface Repository {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  private: boolean;
  description: string | null;
}

export interface Branch {
  name: string;
  commit: { sha: string };
}

export interface Commit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  author: { login: string; avatar_url: string } | null;
}

export interface Post {
  id: string;
  user_id: string;
  repo: string;
  branch: string;
  commit_hash: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  published: boolean;
}
