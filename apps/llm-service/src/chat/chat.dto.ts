import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatCompletionMessageInput {
  @ApiProperty({ enum: ['system', 'user', 'assistant'], example: 'user' })
  @IsString()
  role: 'system' | 'user' | 'assistant';

  @ApiProperty({ example: 'Summarize the contribution of this paper.' })
  @IsString()
  content: string;
}

export class ChatCompletionRequestInput {
  @ApiPropertyOptional({ example: 'qwen2.5-7b-instruct' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ type: [ChatCompletionMessageInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatCompletionMessageInput)
  messages: ChatCompletionMessageInput[];

  @ApiPropertyOptional({ example: 512 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  max_tokens?: number;

  @ApiPropertyOptional({ example: 0.7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  stream?: boolean = false;
}
