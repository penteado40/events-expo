import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  useFonts as useMonoFonts,
} from '@expo-google-fonts/ibm-plex-mono'
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  useFonts as useSansFonts,
} from '@expo-google-fonts/outfit'

/** Outfit 400–700 and IBM Plex Mono 400/500. True once loaded (or failed, falling back to system fonts). */
export function useAppFonts() {
  const [sansLoaded, sansError] = useSansFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  })
  const [monoLoaded, monoError] = useMonoFonts({ IBMPlexMono_400Regular, IBMPlexMono_500Medium })
  return (sansLoaded || !!sansError) && (monoLoaded || !!monoError)
}
