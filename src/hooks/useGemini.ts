import { useMutation } from "@tanstack/react-query";
type inputTypes = {
    idioms: string[],
    information: string
}

type serverRSP = {
    resp: string,
    status: boolean
}

export function useGeminiStory () {
    return useMutation<serverRSP,Error, inputTypes>({
        mutationFn: async (variables) => {
            const req = await fetch('/api/gemini',{
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(variables)
            })
            const data: serverRSP = await req.json()
            return data
        }
    })
}