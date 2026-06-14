import { useMutation } from "@tanstack/react-query";

type InputTypes = {
  idioms: string[];
  information: string;
};

type StoryResponse = {
  story: string;
  storyFa: string;
  storyEn: string;
  status: boolean;
  error?: string;
};

export function useStoryGenerator() {
  return useMutation<StoryResponse, Error, InputTypes>({
    mutationFn: async (variables) => {
      const response = await fetch("/api/story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(variables),
      });

      const data = (await response.json()) as StoryResponse;

      if (!response.ok) {
        return {
          status: false,
          story: data.error || "Story creation failed.",
          storyFa: "",
          storyEn: "",
          error: data.error,
        };
      }

      return data;
    },
  });
}
