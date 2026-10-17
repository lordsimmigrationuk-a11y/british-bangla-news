import type { Role } from "./constants";

type ArticleLike = { authorId: string; status: string };
type U = { id: string; role: Role };

export const isEditorOrAbove = (u: U) => u.role === "ADMIN" || u.role === "EDITOR";
export const isAdmin = (u: U) => u.role === "ADMIN";

/** Reporters may edit only their own work while it is still a draft or in review. */
export function canEditArticle(u: U, a: ArticleLike) {
  if (isEditorOrAbove(u)) return true;
  return a.authorId === u.id && (a.status === "DRAFT" || a.status === "REVIEW");
}

/** Publishing, scheduling, unpublishing, archiving, featuring and breaking flags. */
export const canPublish = isEditorOrAbove;
export const canManageSite = isEditorOrAbove; // homepage, categories, videos, pages, messages
export const canManageUsers = isAdmin;
export const canManageSettings = isAdmin;
