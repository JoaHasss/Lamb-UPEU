package pe.edu.upeu.lamb.matricula.service;

import pe.edu.upeu.lamb.matricula.dto.VariacionMatriculaRequest;
import pe.edu.upeu.lamb.matricula.dto.VariacionMatriculaResponse;
import pe.edu.upeu.lamb.matricula.entity.VariacionMatricula;
import pe.edu.upeu.lamb.matricula.exception.ResourceNotFoundException;
import pe.edu.upeu.lamb.matricula.mapper.VariacionMatriculaMapper;
import pe.edu.upeu.lamb.matricula.repository.VariacionMatriculaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VariacionMatriculaService {

    private final VariacionMatriculaRepository variacionMatriculaRepository;
    private final VariacionMatriculaMapper variacionMatriculaMapper;

    public List<VariacionMatriculaResponse> listar() {
        return variacionMatriculaRepository.findAll().stream()
                .map(variacionMatriculaMapper::toResponse)
                .toList();
    }

    public VariacionMatriculaResponse obtener(Long id) {
        return variacionMatriculaMapper.toResponse(buscarOFallar(id));
    }

    public VariacionMatriculaResponse crear(VariacionMatriculaRequest request) {
        VariacionMatricula entity = variacionMatriculaMapper.toEntity(request);
        return variacionMatriculaMapper.toResponse(variacionMatriculaRepository.save(entity));
    }

    @Transactional
    public VariacionMatriculaResponse actualizar(Long id, VariacionMatriculaRequest request) {
        VariacionMatricula entity = buscarOFallar(id);
        entity.setIdCronograma(request.getIdCronograma());
        entity.setTipo(request.getTipo());
        entity.setFechaInicio(request.getFechaInicio());
        entity.setFechaFin(request.getFechaFin());
        entity.setDescripcion(request.getDescripcion());
        return variacionMatriculaMapper.toResponse(variacionMatriculaRepository.save(entity));
    }

    @Transactional
    public void eliminar(Long id) {
        variacionMatriculaRepository.delete(buscarOFallar(id));
    }

    private VariacionMatricula buscarOFallar(Long id) {
        return variacionMatriculaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Variacion de matricula no encontrada: " + id));
    }
}
