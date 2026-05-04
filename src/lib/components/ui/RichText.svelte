<script lang="ts">
    interface Props {
        text: string;
    }

    let { text }: Props = $props();

    interface TextSegment {
        type: 'text' | 'url' | 'phone';
        content: string;
        href?: string;
    }

    // Function to parse text and convert URLs and phone numbers to structured segments
    function parseText(text: string): TextSegment[][] {
        const lines: TextSegment[][] = [];
        
        // Split by newlines
        const textLines = text.split('\n');
        
        for (const line of textLines) {
            if (line.trim() === '') {
                lines.push([{ type: 'text', content: '' }]);
                continue;
            }
            
            const segments: TextSegment[] = [];
            
            // Find URLs
            const urlRegex = /(www\.[^\s]+|https?:\/\/[^\s]+)/g;
            let urlMatch;
            let lastIndex = 0;
            
            while ((urlMatch = urlRegex.exec(line)) !== null) {
                // Add text before the URL
                if (urlMatch.index > lastIndex) {
                    const textBefore = line.slice(lastIndex, urlMatch.index);
                    if (textBefore) {
                        segments.push({ type: 'text', content: textBefore });
                    }
                }
                
                // Add the URL segment
                const url = urlMatch[0];
                const href = url.startsWith('www.') ? `https://${url}` : url;
                segments.push({ type: 'url', content: url, href });
                
                lastIndex = urlRegex.lastIndex;
            }
            
            // Add remaining text after last URL
            if (lastIndex < line.length) {
                const remainingText = line.slice(lastIndex);
                if (remainingText) {
                    segments.push({ type: 'text', content: remainingText });
                }
            }
            
            // If no URLs found, process the whole line for phone numbers
            if (segments.length === 0) {
                const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
                let phoneMatch;
                let phoneLastIndex = 0;
                const phoneSegments: TextSegment[] = [];
                
                while ((phoneMatch = phoneRegex.exec(line)) !== null) {
                    // Add text before the phone
                    if (phoneMatch.index > phoneLastIndex) {
                        const textBefore = line.slice(phoneLastIndex, phoneMatch.index);
                        if (textBefore) {
                            phoneSegments.push({ type: 'text', content: textBefore });
                        }
                    }
                    
                    // Add the phone segment
                    const phone = phoneMatch[0];
                    const digits = phone.replace(/\D/g, '');
                    phoneSegments.push({ type: 'phone', content: phone, href: `tel:${digits}` });
                    
                    phoneLastIndex = phoneRegex.lastIndex;
                }
                
                // Add remaining text after last phone
                if (phoneLastIndex < line.length) {
                    const remainingText = line.slice(phoneLastIndex);
                    if (remainingText) {
                        phoneSegments.push({ type: 'text', content: remainingText });
                    }
                }
                
                // If no phones found, just add the whole line as text
                if (phoneSegments.length === 0) {
                    phoneSegments.push({ type: 'text', content: line });
                }
                
                lines.push(phoneSegments);
            } else {
                // Process URL segments for phone numbers
                const processedSegments: TextSegment[] = [];
                for (const segment of segments) {
                    if (segment.type === 'text') {
                        const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
                        let phoneMatch;
                        let phoneLastIndex = 0;
                        
                        while ((phoneMatch = phoneRegex.exec(segment.content)) !== null) {
                            // Add text before the phone
                            if (phoneMatch.index > phoneLastIndex) {
                                const textBefore = segment.content.slice(phoneLastIndex, phoneMatch.index);
                                if (textBefore) {
                                    processedSegments.push({ type: 'text', content: textBefore });
                                }
                            }
                            
                            // Add the phone segment
                            const phone = phoneMatch[0];
                            const digits = phone.replace(/\D/g, '');
                            processedSegments.push({ type: 'phone', content: phone, href: `tel:${digits}` });
                            
                            phoneLastIndex = phoneRegex.lastIndex;
                        }
                        
                        // Add remaining text after last phone
                        if (phoneLastIndex < segment.content.length) {
                            const remainingText = segment.content.slice(phoneLastIndex);
                            if (remainingText) {
                                processedSegments.push({ type: 'text', content: remainingText });
                            }
                        }
                    } else {
                        processedSegments.push(segment);
                    }
                }
                lines.push(processedSegments);
            }
        }
        
        return lines;
    }

    const parsedLines = $derived(parseText(text));
</script>

<div class="rich-text">
    {#each parsedLines as line, lineIndex}
        {#each line as segment}
            {#if segment.type === 'text'}
                {segment.content}
            {:else if segment.type === 'url'}
                <a href={segment.href} target="_blank" rel="noopener noreferrer" class="link">{segment.content}</a>
            {:else if segment.type === 'phone'}
                <a href={segment.href} class="link">{segment.content}</a>
            {/if}
        {/each}
        {#if lineIndex < parsedLines.length - 1}
            <br />
        {/if}
    {/each}
</div>

<style>
    .rich-text {
        line-height: 1.5;
        white-space: pre-wrap;
    }
    
    .link {
        color: var(--link, #0066cc);
        text-decoration: underline;
    }
    
    .link:hover {
        color: var(--link-hover, #0052a3);
    }
</style>
