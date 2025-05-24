export class ContentProcessor {
  /**
   * Extract summary from content
   * @param {string} content 
   * @param {number} maxLength 
   * @returns {string}
   */
  static extractSummary(content, maxLength = 500) {
    if (!content || typeof content !== 'string') return '';
    
    // Remove markdown formatting and HTML tags
    let cleaned = content
      .replace(/#+\s/g, '') // Remove markdown headers
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Replace links with text
      .replace(/```[\s\S]*?```/g, '[Code Block]') // Replace code blocks
      .replace(/`([^`]+)`/g, '$1') // Remove inline code formatting
      .trim();

    if (cleaned.length <= maxLength) return cleaned;

    // Find the last complete sentence within the limit
    let truncated = cleaned.substring(0, maxLength);
    const lastSentence = truncated.lastIndexOf('.');
    
    if (lastSentence > maxLength * 0.5) {
      return truncated.substring(0, lastSentence + 1) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Extract sections from content
   * @param {string} content 
   * @returns {Array<{title: string, content: string, level: number}>}
   */
  static extractSections(content) {
    if (!content || typeof content !== 'string') return [];
    
    const sections = [];
    const lines = content.split('\n');
    let currentSection = { title: '', content: '', level: 0 };
    
    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        if (currentSection.title) {
          sections.push({ ...currentSection });
        }
        currentSection = {
          title: headerMatch[2],
          content: '',
          level: headerMatch[1].length
        };
      } else {
        currentSection.content += line + '\n';
      }
    }
    
    if (currentSection.title) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  /**
   * Find relevant sections based on query
   * @param {string} content 
   * @param {string} query 
   * @returns {string}
   */
  static findRelevantSections(content, query) {
    if (!content || !query) return '';
    
    const sections = this.extractSections(content);
    const queryLower = query.toLowerCase();
    const relevantSections = sections.filter(section => 
      section.title.toLowerCase().includes(queryLower) ||
      section.content.toLowerCase().includes(queryLower)
    );

    if (relevantSections.length === 0) {
      return this.extractSummary(content);
    }

    return relevantSections
      .map(section => `## ${section.title}\n${section.content.trim()}`)
      .join('\n\n');
  }
}