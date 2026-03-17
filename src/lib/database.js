/**
 * database.js — Supabase database operations for EDITH.
 *
 * Provides functions for managing chats and messages.
 * All queries are automatically scoped to the current user via RLS.
 */

import { supabase } from './supabase';

/* ══════════════════════════════════════════════
   CHATS
   ══════════════════════════════════════════════ */

/**
 * Fetch all chats for the current user, newest first.
 */
export async function getChats() {
    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Create a new chat for the current user.
 * @param {string} title — chat title (defaults to first message preview)
 * @returns {object} — the newly created chat row
 */
export async function createChat(title = 'New Chat') {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('chats')
        .insert({ user_id: user.id, title })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Rename a chat.
 */
export async function updateChatTitle(chatId, title) {
    const { error } = await supabase
        .from('chats')
        .update({ title })
        .eq('id', chatId);

    if (error) throw error;
}

/**
 * Delete a chat (cascades to its messages).
 */
export async function deleteChat(chatId) {
    const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

    if (error) throw error;
}

/* ══════════════════════════════════════════════
   MESSAGES
   ══════════════════════════════════════════════ */

/**
 * Get all messages for a chat, oldest first.
 * @param {string} chatId
 */
export async function getMessages(chatId) {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
}

/**
 * Insert a single message.
 * @param {string} chatId
 * @param {'user' | 'assistant' | 'system'} role
 * @param {string} content
 */
export async function insertMessage(chatId, role, content) {
    const { data, error } = await supabase
        .from('messages')
        .insert({ chat_id: chatId, role, content })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Auto-title a chat based on the first user message.
 * Truncates to 40 chars.
 */
export async function autoTitleChat(chatId, firstMessage) {
    const title = firstMessage.length > 40
        ? firstMessage.substring(0, 40) + '...'
        : firstMessage;

    await updateChatTitle(chatId, title);
    return title;
}
