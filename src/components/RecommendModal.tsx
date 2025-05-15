import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle } from "lucide-react";
import { ModalProps } from "../types/blog";

export function RecommendModal({ isOpen, onClose, onSubmit, successMessage, setSuccessMessage }: ModalProps) {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(url);
      setSuccessMessage('추천해주셔서 감사합니다!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('추천 등록 실패:', error);
      if (error instanceof Error) {
        setSuccessMessage(`추천 등록 실패: ${error.message}`);
      } else {
        setSuccessMessage('추천 등록 실패');
      }
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg"
          >
            <h2 className="text-xl font-semibold mb-4 text-[#4C8CF7]">블로그 글 추천하기</h2>
            {successMessage && (
              <div className="text-green-600 text-center py-4">
                {successMessage}
              </div>
            ) || (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    블로그 URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#4C8CF7] focus:border-[#4C8CF7]"
                    placeholder="https://example.com/blog-post"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !url}
                    className={`px-4 py-2 text-sm font-medium text-white bg-[#4C8CF7] rounded-md hover:bg-[#3A7DE8] disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting ? '추천 중...' : '추천하기'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 