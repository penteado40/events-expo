import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  useFonts as useMonoFonts,
} from '@expo-google-fonts/ibm-plex-mono'
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
  useFonts as useSansFonts,
} from '@expo-google-fonts/ibm-plex-sans'

/** IBM Plex Sans 400/500/600 and Mono 400/500. True once loaded (or failed, falling back to system fonts). */
export function useAppFonts() {
  const [sansLoaded, sansError] = useSansFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
  })
  const [monoLoaded, monoError] = useMonoFonts({ IBMPlexMono_400Regular, IBMPlexMono_500Medium })
  return (sansLoaded || !!sansError) && (monoLoaded || !!monoError)
}
